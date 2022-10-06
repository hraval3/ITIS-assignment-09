exports.handler = async (event) => {
    // TODO implement
    const keyword = event.queryStringParameters.keyword;
    const message_response = "Harsh Raval says "+keyword;
    const response = {
        statusCode: 200,
        body: JSON.stringify({
      message_response
    })
    
    };
    return response;
};