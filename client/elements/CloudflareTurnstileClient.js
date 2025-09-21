
export class CloudflareTurnstileClient {

  static theme = "light"

  static init(theme = "light") {
    CloudflareTurnstileClient.theme = theme;
    
    if (!process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT || process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT?.trim().length === 0) {
      return
    }
    
    window.onloadTurnstileCallback = () => {
      this.initCloudflareTurnslide()
    }
  }

  static initCloudflareTurnslide() {
    turnstile.render("#cloudFlareTurnslide", {
      sitekey: process.env.CLOUDFLARE_TURNSLIDE_KEY_CLIENT,
      theme: CloudflareTurnstileClient.theme,
      callback: (token) => {
        // Challenge completed successfuly
      },
    });
  }
}