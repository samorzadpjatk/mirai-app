# 📱 Typy Wiadomości Powiadomień - Bank Monet

## 🔄 **Natychmiastowe Powiadomienia** (po akcjach administratora)

### 1. **Dodanie Monet do Gildii** 💰
```
Tytuł: "💰 [Nazwa Gildii] - Nowe monety!"
Treść: "Wasza gildia otrzymała [ilość] monet! Sprawdźcie aktualny ranking."

Dane:
- type: "coins_added"
- amount: [ilość monet]
- groupName: "[nazwa gildii]"
- timestamp: [czas]
```

### 2. **Usunięcie Monet z Gildii** 💸
```
Tytuł: "💸 [Nazwa Gildii] - Monety usunięte"
Treść: "Wasza gildia straciła [ilość] monet. [Powód lub 'Sprawdźcie aktualny ranking.']"

Dane:
- type: "coins_removed"
- amount: [ilość monet]
- groupName: "[nazwa gildii]"
- reason: "[powód]" (opcjonalnie)
- timestamp: [czas]
```

---

## ⏰ **Zaplanowane Powiadomienia** (automatyczne o określonych godzinach)

### 1. **Aktualizacja Rankingu** 🏆

#### **Wiadomość Ogólna** (backup)
```
Tytuł: "🏆 Ranking Gildii - Aktualizacja"
Treść: "🏆 Aktualizacja Rankingu Gildii!

Najlepsze 3 gildie:
🥇 [Nazwa 1. gildii]: [ilość] monet
🥈 [Nazwa 2. gildii]: [ilość] monet  
🥉 [Nazwa 3. gildii]: [ilość] monet"

Dane:
- type: "ranking_update"
- topGroup: "[nazwa liderującej gildii]"
- topCoins: [ilość monet lidera]
- timestamp: [czas]
```

#### **Wiadomość dla 1. Miejsca** 🥇
```
Tytuł: "🥇 [Nazwa Gildii] - Liderzy Rankingu!"
Treść: "Gratulacje! Wasza gildia jest na 1. miejscu z [ilość] monetami! Kontynuujcie dobrą pracę!"

Dane:
- type: "personalized_ranking_update"
- groupName: "[nazwa gildii]"
- position: 1
- coins: [ilość monet]
- topGroupName: "[nazwa gildii]" (ta sama)
- topGroupCoins: [ilość monet]
- timestamp: [czas]
```

#### **Wiadomość dla 2. Miejsca** 🥈
```
Tytuł: "🥈 [Nazwa Gildii] - Top 3!"
Treść: "Wasza gildia jest na 2. miejscu z [ilość] monetami! Do 1. miejsca brakuje wam [różnica] monet!"

Dane:
- type: "personalized_ranking_update"
- groupName: "[nazwa gildii]"
- position: 2
- coins: [ilość monet]
- topGroupName: "[nazwa liderującej gildii]"
- topGroupCoins: [ilość monet lidera]
- timestamp: [czas]
```

#### **Wiadomość dla 3. Miejsca** 🥉
```
Tytuł: "🥉 [Nazwa Gildii] - Top 3!"
Treść: "Wasza gildia jest na 3. miejscu z [ilość] monetami! Świetna robota! Jesteście w TOP 3!"

Dane:
- type: "personalized_ranking_update"
- groupName: "[nazwa gildii]"
- position: 3
- coins: [ilość monet]
- topGroupName: "[nazwa liderującej gildii]"
- topGroupCoins: [ilość monet lidera]
- timestamp: [czas]
```

#### **Wiadomość dla 4+ Miejsc** 📊
```
Tytuł: "📊 [Nazwa Gildii] - Pozycja [numer]"
Treść: "Wasza gildia jest obecnie na [numer]. miejscu z [ilość] monetami. Lider ([Nazwa Lidera]) ma [ilość lidera] monet. Pozostało [różnica] monet do dogonięcia!"

Dane:
- type: "personalized_ranking_update"
- groupName: "[nazwa gildii]"
- position: [numer pozycji]
- coins: [ilość monet]
- topGroupName: "[nazwa liderującej gildii]"
- topGroupCoins: [ilość monet lidera]
- timestamp: [czas]
```

### 2. **Podsumowanie Tygodniowe** 📈
```
Tytuł: "📈 Tygodniowe Podsumowanie - [Nazwa Gildii]"
Treść: "🗓️ Podsumowanie Tygodnia

Wasza gildia: [Nazwa] (Pozycja [numer])
Monety: [ilość]
Lider: [Nazwa Lidera] ([ilość] monet)

[Status message w zależności od pozycji]"

Dane:
- type: "weekly_summary"
- groupName: "[nazwa gildii]"
- position: [numer pozycji]
- coins: [ilość monet]
- topGroupName: "[nazwa liderującej gildii]"
- topGroupCoins: [ilość monet lidera]
- timestamp: [czas]
```

---

## 🎯 **Funkcjonalność Powiadomień**

### **Automatyczne Pobieranie Danych z Bazy**
- ✅ System automatycznie pobiera aktualne dane o rankingu gildii
- ✅ Sortuje gildie według ilości monet (od największej do najmniejszej)
- ✅ Personalizuje wiadomości dla każdej gildii
- ✅ Oblicza różnice monet między pozycjami
- ✅ Uwzględnia zarówno członków jak i organizatorów gildii

### **Harmonogram Wysyłania**
- ✅ Administratorzy mogą tworzyć harmonogramy w panelu `/admin/schedules`
- ✅ Możliwość ustawienia dat rozpoczęcia i zakończenia
- ✅ Wybór godziny i minuty wysłania
- ✅ Aktywacja/deaktywacja harmonogramów
- ✅ Śledzenie ostatniego uruchomienia

### **Monitorowanie**
- ✅ Logi w konsoli serwera
- ✅ Statystyki wysyłania (ile wysłano, ile się nie powiodło)
- ✅ Śledzenie błędów i problemów
- ✅ Test ręczny przez panel administracyjny

### **Przykład Działania**
1. **Czas**: Codziennie o 18:00
2. **Akcja**: System pobiera ranking z bazy danych
3. **Personalizacja**: Tworzy unikalną wiadomość dla każdej gildii
4. **Wysłanie**: Wysyła do wszystkich członków i organizatorów gildii
5. **Logowanie**: Zapisuje statystyki w logach serwera

---

## 🔧 **Konfiguracja i Testowanie**

### **Panel Administracyjny**
- 📍 **URL**: `/admin/schedules`
- 🎛️ **Funkcje**: Tworzenie, edycja, usuwanie harmonogramów
- 🧪 **Test Ręczny**: Przycisk "Wyślij Teraz" do natychmiastowego testowania

### **API Endpoint**
- 📍 **URL**: `/api/scheduler`
- 🔒 **Bezpieczeństwo**: Klucz API (SCHEDULER_API_KEY)
- ⚡ **Wywołanie**: Może być używane przez zewnętrzne cron job'y

### **Cron Job (Rekomendacja)**
```bash
# Sprawdzanie co minutę czy są harmonogramy do wykonania
* * * * * curl -H "Authorization: Bearer YOUR_API_KEY" https://yourapp.com/api/scheduler
```
