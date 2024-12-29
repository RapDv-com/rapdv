declare const turnstile: any

export class CloudflareTurnstileClient {

  private static theme: string = "light"

  public static init(theme: string = "light") {
    CloudflareTurnstileClient.theme = theme;
    
    if (!process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT || process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT?.trim().length === 0) {
      return
    }
    
    (window as any).onloadTurnstileCallback = () => {
      this.initCloudflareTurnslide()
    }
  }

  private static initCloudflareTurnslide() {
    turnstile.render("#cloudFlareTurnslide", {
      sitekey: process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT,
      theme: CloudflareTurnstileClient.theme,
      callback: (token) => {
        // Challenge completed successfuly
      },
    });
  }
}