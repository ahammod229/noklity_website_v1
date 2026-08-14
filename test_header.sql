CREATE OR REPLACE FUNCTION get_test_header() RETURNS json LANGUAGE plpgsql AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json;
END;
$$;
