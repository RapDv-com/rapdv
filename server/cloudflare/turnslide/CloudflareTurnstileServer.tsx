import { Request } from "../../server/Request";

export class CloudflareTurnstileServer {

    public static async isRequestValidated(req: Request): Promise<boolean> {
        const token = req.body["cf-turnstile-response"]
        const ip: any = req.headers["CF-Connecting-IP"]
  
        const formData = new FormData()
        formData.append("secret", process.env.CLOUDFLARE_TURNSLIDE_KEY_SERVER)
        formData.append("response", token)
        formData.append("remoteip", ip)
  
        const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        const result = await fetch(url, {
          body: formData,
          method: "POST"
        })
  
        const outcome = await result.json()
        return outcome.success
    }
}