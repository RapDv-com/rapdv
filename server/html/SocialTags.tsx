import React from "react"

type Props = {
  url: string, 
  siteName: string, 
  title: string, 
  description: string,
  imageUrl: string, 
  twitterTag?: string, 
}

export const SocialTags = ({ url, siteName, title, description, imageUrl, twitterTag }: Props) => {
  return <>
    <meta property="og:title" content={title} />
    <meta property="og:url" content={url} />
    <meta property="og:site_name" content={siteName} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
    {twitterTag && <meta name="twitter:site" content={twitterTag} />}
    {twitterTag && <meta name="twitter:creator" content={twitterTag} />}
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image:src" content={imageUrl} />
    <meta name="twitter:url" content={url} />
  </>
}