/** Public storefront images copied from flexicell/public/img */
export function imgPath(filename: string): string {
  return `/img/${encodeURIComponent(filename)}`
}

export const storefrontImages = {
  logo: '/img/flexicell_logo.png',
  hotdeal: imgPath('hotdeal.png'),
  bannerPhones: imgPath('IMAGE 2026-05-05 11:21:39.jpg'),
  bannerDelivery: imgPath('IMAGE 2026-05-05 11:21:43.jpg'),
  shops: [imgPath('shop01.png'), imgPath('shop02.png'), imgPath('shop03.png')],
  showcase: [imgPath('product01.png'), imgPath('product02.png'), imgPath('product03.png')],
} as const
