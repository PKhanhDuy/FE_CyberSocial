export const optimizeCloudinaryImage = (url: string | undefined, width: number) => {
  if (!url || !url.includes("/image/upload/")) return url

  const transformation = `f_auto,q_auto,w_${width},c_limit`
  return url.replace("/image/upload/", `/image/upload/${transformation}/`)
}
