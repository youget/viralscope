export async function GET() {

  const services = [
    { url: 'https://ipapi.co/json/', timeout: 3000 },
    { url: 'https://ipapi.com/ip_api.php?format=json', timeout: 3000 },
    { url: 'https://ipinfo.io/json', timeout: 3000 },
  ];

  for (const { url, timeout } of services) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!res.ok) continue;
      const data = await res.json();
      let country = data.country_code || data.country || data.countryCode;
      if (country) {
        let lang = 'en';
        if (data.languages) lang = data.languages.split(',')[0];
        else if (data.lang) lang = data.lang;
        return Response.json({ country, lang });
      }
    } catch (e) {
      console.log(`Geo service ${url} error:`, e.message);
    }
  }

  return Response.json({ country: 'US', lang: 'en' });
}
