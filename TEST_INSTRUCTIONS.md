# Payment System Test Instructions

Bu dokümanda ödeme sistemi için yazılan kapsamlı testlerin nasıl çalıştırılacağı açıklanmaktadır.

## Test Kategorileri

### 1. Backend Unit Tests
Backend'de ödeme validasyonu, DTO validasyonu ve hata yönetimi testleri.

**Dosyalar:**
- `backend/src/payment/payment.service.spec.ts` - PaymentService unit testleri
- `backend/src/payment/payment.controller.spec.ts` - PaymentController unit testleri  
- `backend/src/payment/dto/create-payment.dto.spec.ts` - DTO validasyon testleri

**Çalıştırma:**
```bash
# Tüm backend unit testleri
npm run test:backend:unit

# Sadece payment unit testleri
npm run test:backend:payment:unit

# Belirli bir test dosyası
cd backend && npm run test payment.service.spec.ts
```

### 2. Frontend Unit Tests
Frontend payment bileşenleri, form validasyonu ve API çağrıları testleri.

**Dosyalar:**
- `frontend/src/components/payment/__tests__/PaymentProcessor.test.tsx`
- `frontend/src/components/payment/__tests__/PaymentMethodSelector.test.tsx`
- `frontend/src/services/__tests__/paymentAPI.test.ts`

**Çalıştırma:**
```bash
# Tüm frontend unit testleri
npm run test:frontend:unit

# Sadece payment unit testleri
npm run test:frontend:payment:unit

# Belirli bir test dosyası
cd frontend && npm run test PaymentProcessor.test.tsx
```

### 3. Backend E2E Tests
Backend API endpoint'lerinin tam entegrasyonu testleri.

**Dosyalar:**
- `backend/test/payment.e2e-spec.ts` - Payment API E2E testleri
- `backend/test/test-utils.ts` - Test yardımcı fonksiyonları

**Çalıştırma:**
```bash
# Tüm backend E2E testleri
npm run test:backend:e2e

# Sadece payment E2E testleri
npm run test:backend:payment:e2e

# Belirli bir E2E test dosyası
cd backend && npm run test:e2e payment.e2e-spec.ts
```

### 4. Frontend E2E Tests
Tarayıcıda tam kullanıcı akışı testleri.

**Dosyalar:**
- `frontend/cypress/e2e/payment.cy.ts` - Payment flow E2E testleri
- `frontend/cypress/support/commands.ts` - Cypress custom commands
- `frontend/cypress/fixtures/order.json` - Test verileri

**Çalıştırma:**
```bash
# Tüm frontend E2E testleri
npm run test:frontend:e2e

# Sadece payment E2E testleri
npm run test:frontend:payment:e2e

# Cypress UI ile çalıştırma
cd frontend && npm run cypress:open
```

## Hızlı Test Komutları

### Tüm Payment Testleri
```bash
# Tüm payment testleri (unit + E2E)
npm run test:payment

# Sadece unit testler
npm run test:payment:unit

# Sadece E2E testler
npm run test:payment:e2e
```

### Validasyon Testleri
```bash
# Sadece validasyon testleri
npm run test:validation
```

### Entegrasyon Testleri
```bash
# Sadece entegrasyon testleri
npm run test:integration
```

### CI/CD için
```bash
# CI ortamında çalıştırılacak tüm testler
npm run test:ci
```

## Test Senaryoları

### 1. Amount Validation Tests
- ✅ String amount hatası: `"amount must be a number conforming to the specified constraints"`
- ✅ Negatif amount hatası: `"amount must be a positive number"`
- ✅ Sıfır amount hatası: `"amount must be greater than 0"`
- ✅ NaN/Infinity amount hataları
- ✅ Çok fazla ondalık basamak hatası

### 2. UUID Validation Tests
- ✅ Geçersiz UUID formatı
- ✅ Boş string UUID
- ✅ Null/undefined UUID

### 3. Payment Method Validation Tests
- ✅ Geçersiz payment method
- ✅ Null/undefined payment method
- ✅ Tüm geçerli payment methodları

### 4. Business Logic Tests
- ✅ Ödeme zaten mevcut hatası (409 Conflict)
- ✅ Sipariş ödeme için hazır değil hatası
- ✅ Nakit ödeme başarılı akışı
- ✅ Kart ödeme pending durumu
- ✅ Payment gateway entegrasyonu

### 5. Integration Tests
- ✅ Sipariş durumu güncelleme
- ✅ Masa durumu güncelleme
- ✅ Tenant izolasyonu
- ✅ Authentication kontrolü

### 6. Frontend Tests
- ✅ Payment method seçimi
- ✅ Form validasyonu
- ✅ Loading durumları
- ✅ Hata mesajları
- ✅ Retry mekanizması
- ✅ Accessibility testleri

## Test Veritabanı Kurulumu

E2E testler için test veritabanı gereklidir:

```bash
# Backend test veritabanı kurulumu
cd backend
npm run test:db:setup

# Test verilerini temizleme
npm run test:db:clean
```

## Test Coverage

Test coverage raporları için:

```bash
# Coverage raporu oluşturma
npm run test:coverage

# Coverage raporunu görüntüleme
open backend/coverage/lcov-report/index.html
open frontend/coverage/lcov-report/index.html
```

## Debugging

### Backend Tests
```bash
# Debug modunda test çalıştırma
cd backend && npm run test:debug payment.service.spec.ts
```

### Frontend Tests
```bash
# Debug modunda test çalıştırma
cd frontend && npm run test:debug PaymentProcessor.test.tsx
```

### Cypress Tests
```bash
# Cypress debug modunda
cd frontend && npm run cypress:open
```

## Test Sonuçları

Testler başarılı olduğunda:
- ✅ Tüm validasyon hataları doğru şekilde yakalanıyor
- ✅ API endpoint'leri doğru HTTP status kodları döndürüyor
- ✅ Frontend bileşenleri hata durumlarını doğru gösteriyor
- ✅ E2E akışlar kullanıcı deneyimini doğru simüle ediyor

## Sorun Giderme

### Test Başarısız Olursa
1. Test veritabanının çalıştığından emin olun
2. Environment variable'ların doğru ayarlandığından emin olun
3. Dependencies'lerin güncel olduğundan emin olun

### Cypress Testleri Başarısız Olursa
1. Frontend uygulamasının çalıştığından emin olun
2. Backend API'nin çalıştığından emin olun
3. Test fixture'larının doğru olduğundan emin olun

### Performance Sorunları
1. Test parallelization kullanın
2. Test veritabanını optimize edin
3. Gereksiz test verilerini temizleyin

## Sürekli Entegrasyon

CI/CD pipeline'da çalıştırılması gereken testler:

```yaml
# GitHub Actions örneği
- name: Run Payment Tests
  run: |
    npm run test:payment:unit
    npm run test:payment:e2e
```

Bu testler, ödeme sistemi ile ilgili tüm hataları yakalayacak ve sistem güvenilirliğini artıracaktır.
