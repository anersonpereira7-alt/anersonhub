const SOCIAL_AD_HTML = `<!doctype html>
<html lang="pt-BR">
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="margin:0;overflow:hidden;background:transparent">
    <script src="https://pl31452360.profitableratecpmnetwork.com/e6/87/79/e687794029c8df48a0dcd3a7ebb99a2f.js"><\/script>
  </body>
</html>`;

const BANNER_AD_HTML = `<!doctype html>
<html lang="pt-BR">
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="margin:0;overflow:hidden;background:transparent">
    <script>
      atOptions = {
        'key': '04f989bf5d1ed29dc80fc86a766c625b',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };
    <\/script>
    <script src="https://www.highrevenueformat.com/04f989bf5d1ed29dc80fc86a766c625b/invoke.js"><\/script>
  </body>
</html>`;

export function BettingAds() {
  return (
    <aside aria-label="Publicidade" className="mt-4 space-y-3">
      <iframe
        title="Publicidade de apostas"
        srcDoc={SOCIAL_AD_HTML}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="block h-24 w-full border-0 bg-transparent"
      />
      <div className="mx-auto h-[50px] w-[320px] max-w-full overflow-hidden">
        <iframe
          title="Publicidade em banner"
          srcDoc={BANNER_AD_HTML}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          width="320"
          height="50"
          className="block h-[50px] w-[320px] max-w-full border-0 bg-transparent"
        />
      </div>
    </aside>
  );
}