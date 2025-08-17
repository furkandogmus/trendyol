import React, { createContext, useContext, useState, useEffect } from 'react';

const PlatformContext = createContext();

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};

export const PlatformProvider = ({ children }) => {
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [siparisler, setSiparisler] = useState([]);

  // Platform değiştiğinde verileri yükle
  useEffect(() => {
    if (currentPlatform) {
      clearOtherPlatformData(currentPlatform);
      loadPlatformData(currentPlatform);
    }
  }, [currentPlatform]);

  const clearOtherPlatformData = (currentPlatform) => {
    // Mevcut platform dışındaki platformun verilerini temizle
    const otherPrefix = currentPlatform === 'hepsiburada' ? 'tr_' : 'hb_';
    
    // Diğer platformun verilerini localStorage'dan temizle
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(otherPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Eski formatdaki verileri de temizle (prefix olmayan)
    if (currentPlatform === 'hepsiburada') {
      // Hepsiburada'ya geçerken Trendyol'un prefix olmayan verilerini temizle
      localStorage.removeItem('urunler');
      localStorage.removeItem('siparisler');
    }
  };

  const loadPlatformData = (platform) => {
    const prefix = platform === 'hepsiburada' ? 'hb_' : 'tr_';
    
    // Ürünleri yükle
    const savedUrunler = localStorage.getItem(`${prefix}urunler`);
    if (savedUrunler) {
      try {
        setUrunler(JSON.parse(savedUrunler));
      } catch (error) {
        console.error('Ürün verileri yüklenirken hata:', error);
        setUrunler([]);
      }
    } else {
      setUrunler([]);
    }

    // Siparişleri yükle
    const savedSiparisler = localStorage.getItem(`${prefix}siparisler`);
    if (savedSiparisler) {
      try {
        setSiparisler(JSON.parse(savedSiparisler));
      } catch (error) {
        console.error('Sipariş verileri yüklenirken hata:', error);
        setSiparisler([]);
      }
    } else {
      setSiparisler([]);
    }
  };

  const savePlatformData = (platform, newUrunler = null, newSiparisler = null) => {
    const prefix = platform === 'hepsiburada' ? 'hb_' : 'tr_';
    
    if (newUrunler !== null) {
      localStorage.setItem(`${prefix}urunler`, JSON.stringify(newUrunler));
      setUrunler(newUrunler);
    }
    
    if (newSiparisler !== null) {
      localStorage.setItem(`${prefix}siparisler`, JSON.stringify(newSiparisler));
      setSiparisler(newSiparisler);
    }
  };

  const handleUrunUpload = (data) => {
    savePlatformData(currentPlatform, data, null);
  };

  const handleSiparisUpload = (data) => {
    savePlatformData(currentPlatform, null, data);
  };

  const handleUrunUpdate = (originalUrun, updatedUrun) => {
    const updatedUrunler = urunler.map(urun => {
      // Platform bazlı unique key belirleme
      let uniqueKey = '';
      if (currentPlatform === 'hepsiburada') {
        uniqueKey = urun['Satıcı Stok Kodu'] || '';
      } else {
        uniqueKey = urun['Tedarikçi Stok Kodu'] || '';
      }
      
      const originalKey = currentPlatform === 'hepsiburada' 
        ? (originalUrun['Satıcı Stok Kodu'] || '') 
        : (originalUrun['Tedarikçi Stok Kodu'] || '');
      
      if (uniqueKey === originalKey) {
        return { ...updatedUrun };
      }
      return urun;
    });
    
    savePlatformData(currentPlatform, updatedUrunler, null);
  };

  const handleSiparisUpdate = (originalSiparis, updatedSiparis) => {
    const updatedSiparisler = siparisler.map(siparis => {
      // Platform bazlı unique key belirleme
      if (currentPlatform === 'hepsiburada') {
        const originalSiparisNo = originalSiparis['Sipariş Numarası'] || '';
        const originalPaketNo = originalSiparis['Paket Numarası'] || '';
        const originalKalemNo = originalSiparis['Kalem Numarası'] || '';
        
        const currentSiparisNo = siparis['Sipariş Numarası'] || '';
        const currentPaketNo = siparis['Paket Numarası'] || '';
        const currentKalemNo = siparis['Kalem Numarası'] || '';
        
        if (currentSiparisNo === originalSiparisNo && 
            currentPaketNo === originalPaketNo &&
            currentKalemNo === originalKalemNo) {
          return { ...updatedSiparis };
        }
      } else {
        const originalPaketNo = originalSiparis['Paket No'] || originalSiparis['Sipariş Numarası'] || '';
        const currentPaketNo = siparis['Paket No'] || siparis['Sipariş Numarası'] || '';
        const originalSiparisNo = originalSiparis['Sipariş Numarası'] || originalSiparis['Paket No'] || '';
        const currentSiparisNo = siparis['Sipariş Numarası'] || siparis['Paket No'] || '';
        
        if ((originalPaketNo && currentPaketNo === originalPaketNo) ||
            (originalSiparisNo && currentSiparisNo === originalSiparisNo)) {
          return { ...updatedSiparis };
        }
      }
      return siparis;
    });
    
    savePlatformData(currentPlatform, null, updatedSiparisler);
  };

  const handleSiparisAdd = (newSiparis) => {
    const newSiparisler = [...siparisler, newSiparis];
    savePlatformData(currentPlatform, null, newSiparisler);
  };

  const value = {
    currentPlatform,
    setCurrentPlatform,
    urunler,
    siparisler,
    handleUrunUpload,
    handleSiparisUpload,
    handleUrunUpdate,
    handleSiparisUpdate,
    handleSiparisAdd,
    loadPlatformData
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
};