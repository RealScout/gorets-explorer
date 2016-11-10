export default class SearchService {

  // search params
  static params = {
    id: null,  // the source to query
    resource: null,
    class: null,
    select: null,
    query: null,
    // optional
    format: null, // defaults to COMPACT-DECODED
    counttype: null, // defaults = 0 (none)
    querytype: null, // defaults to DMQL2
    offset: null, // defaults to 1
    limit: null, // defaults to none
  };


  static search(params) {
    return fetch(`${config.api}/rpc`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        method: 'SearchService.Run',
        params: [{
          ...params,
          format: 'COMPACT-DECODED',
          'query-type': 'DMQL2',
          'count-type': 1,
        }],
      }),
    });
  }
}
