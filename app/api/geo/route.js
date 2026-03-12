export async function GET(request) {
  const country = request.headers.get('x-vercel-ip-country') || 'US'
  const acceptLang = request.headers.get('accept-language') || 'en'
  const lang = acceptLang.split(',')[0].split('-')[0]
  return Response.json({ country, lang })
}
