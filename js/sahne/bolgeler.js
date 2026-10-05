// Bölge sanat paletleri (§5.3). S1: yalnızca Zonguldak çizilir; diğerleri S2 için yer tutucu renklerle durur.

export const BOLGE_SANAT = {
  zonguldak: {
    gok: ['#7EC8E3', '#BFE6F2', '#F3E3C3'],
    uzakTepe: ['#4F8FA0', '#6AA4A8'],
    deniz: ['#2E6A78', '#23535E'],
    denizIsik: '#6FB3BF',
    tepe: ['#3E8A4A', '#5FA45A'],
    cimen: '#6DAA3F',
    toprak: '#6B3F22',
    kaya: ['#4A2E1C', '#3A2416', '#2A1A10'],
    // Satır katmanları (koyu, açık, orta, sıcak): toprak ve kaya tonlarından türetilir
    katman: ['#3A2416', '#6B3F22', '#5A3620', '#4A2E1C', '#7A4A28'],
    magara: ['#2C1C13', '#1A0F0A'],
    cevher: '#1F2326',
    cevherIsik: '#9FB7C9',
    kandil: '#FFC873',
    kereste: ['#8A5A32', '#6B4425'],
    celik: ['#6E7A86', '#A9B4BE'],
    depoCati: '#B8432F',
    satisDuvar: '#C4553B',
    satisCati: '#8E3426',
    tohum: 1907,
  },
}

// S2 cevher renkleri (§5.3)
export const CEVHER_RENK = {
  zonguldak: ['#1F2326', '#9FB7C9'],
  bartin: ['#4A4048', '#B07A8E'],
  kastamonu: ['#B8642E', '#E3A06A'],
  karabuk: ['#6A5048', '#A57A6A'],
  gumushane: ['#9AA6B2', '#FFFFFF'],
  artvin: ['#D9A21B', '#FFE28A'],
}

export const palet = (kod) => BOLGE_SANAT[kod] || BOLGE_SANAT.zonguldak
