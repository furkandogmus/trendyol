# Sipariş Takip & Kar-Zarar Analizi

Modern React tabanlı sipariş takip ve kar-zarar analizi uygulaması.

## Özellikler

- 📊 **Dashboard** - Sipariş verilerinizin görsel analizi
- 📋 **Sipariş Tablosu** - Detaylı sipariş listesi ve filtreleme
- 💰 **Kar-Zarar Analizi** - Detaylı finansal raporlama
- 📁 **Excel İçe Aktarma** - Sipariş verilerini Excel dosyasından yükleme

## Teknolojiler

- **React 19** - Modern UI framework
- **Material-UI** - Modern ve responsive tasarım
- **Recharts** - İnteraktif grafikler
- **XLSX** - Excel dosya işleme
- **DataGrid** - Gelişmiş tablo özellikleri

## Kurulum

```bash
npm install
npm start
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Kullanım

1. **Excel Yükle** sekmesinden sipariş verilerinizi yükleyin
2. **Dashboard**'da genel analizi görüntüleyin
3. **Siparişler** sekmesinde detaylı filtreleme yapın
4. **Kar-Zarar Analizi**'nde finansal raporları inceleyin

## Excel Format Gereksinimleri

Excel dosyanız şu sütunları içermelidir:
- Sipariş Numarası
- Ürün Adı
- Stok Kodu
- Alıcı
- İl
- Sipariş Statüsü
- Adet
- Birim Fiyatı
- Satış Tutarı
- Kargo Firması
- Sipariş Tarihi

## Production Build

```bash
npm run build
```

Build klasörü production için optimize edilmiş dosyaları içerir.

## Destek

Sorunlar için GitHub Issues kullanın.
