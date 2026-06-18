/** Public storefront images copied from flexicell/public/img */
export function imgPath(filename: string): string {
  return `/img/${encodeURIComponent(filename)}`
}

export const storefrontImages = {
  logo: '/img/flexicell_logo.png',
  ads: imgPath('flexicell_ads.png'),
  bannerPhones: imgPath('flexicell_poster.jpg'),
  bannerDelivery: imgPath('flexicell_delivery.jpg'),
  contact:imgPath('flexicell_contact.png'),
  shops: [imgPath('shop01.png'), imgPath('shop02.png'), imgPath('shop03.png')],
  showcase: [imgPath('MacBook_Pro_m5.png'), imgPath('17PMOrange.png'), imgPath('ipad_nobg.png')],
} as const
