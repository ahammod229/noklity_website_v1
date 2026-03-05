export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

export const withCors = (response: Response) => {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export const jsonResponse = (payload: unknown, status = 200) =>
  withCors(
    new Response(JSON.stringify(payload), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  );
