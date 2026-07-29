(() => {
  const config = window.SINEGUGU_SUPABASE;
  if (!config || !window.supabase?.createClient) {
    console.error('Supabase configuration or client library is missing.');
    return;
  }
  window.sineguguSupabase = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
