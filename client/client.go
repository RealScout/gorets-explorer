package client

import (
	"encoding/xml"
	"io"
	"net/http"
	"net/http/cookiejar"

	"golang.org/x/net/context"
	"golang.org/x/net/context/ctxhttp"
	"golang.org/x/net/html/charset"
)

// const DefaultTimeout int = 300000

// standard http header names
const (
	UserAgent   string = "User-Agent"
	Accept      string = "Accept"
	ContentType string = "Content-Type"
	WWWAuth     string = "Www-Authenticate"
	WWWAuthResp string = "Authorization"
)

// rets http header names
const (
	RETSVersion   string = "RETS-Version"
	RETSSessionID string = "RETS-Session-ID"
	RETSRequestID string = "RETS-Request-ID"
	RETSUAAuth    string = "RETS-UA-Authorization"
)

// TODO create a Session interface with a Requester and a reset to clear state and pass that in

// Requester implmenters should not assume any order of ops
type Requester func(ctx context.Context, req *http.Request) (*http.Response, error)

// DefaultSession configures the default rets session
func DefaultSession(user, pwd, userAgent, userAgentPw, retsVersion string, transport http.RoundTripper) (Requester, error) {
	if transport == nil {
		transport = http.DefaultTransport
	}

	client := http.Client{
		Transport: transport,
	}

	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	client.Jar = jar
	// 4) send the request
	request := func(ctx context.Context, req *http.Request) (*http.Response, error) {
		return ctxhttp.Do(ctx, &client, req)
	}
	// 3) www auth
	wwwAuth := (&WWWAuthTransport{
		Requester: request,
		Username:  user,
		Password:  pwd,
	}).Request
	// 2) apply ua auth headers per request, if there is a pwd
	uaAuth := (&UserAgentAuthentication{
		Requester:         wwwAuth,
		UserAgent:         userAgent,
		UserAgentPassword: userAgentPw,
		GetRETSVersion:    CreateRETSVersioner(retsVersion),
		GetSessionID:      CreateSessionIDer(client.Jar),
	}).Request
	// 1) apply default headers first (outermost wrapping)
	headers := func(ctx context.Context, req *http.Request) (*http.Response, error) {
		req.Header.Set(UserAgent, userAgent)
		req.Header.Set(RETSVersion, retsVersion)
		req.Header.Set(Accept, "*/*")
		return uaAuth(ctx, req)
	}
	return headers, nil
}

// SelectedCharsetReader the variable used to set a selected charset
var SelectedCharsetReader func(string, io.Reader) (io.Reader, error) = charset.NewReaderLabel

// GetXMLReader ...
func GetXMLReader(input io.Reader, strict bool) *xml.Decoder {
	decoder := xml.NewDecoder(input)
	if SelectedCharsetReader != nil {
		decoder.CharsetReader = SelectedCharsetReader
	}
	decoder.Strict = strict
	return decoder
}
