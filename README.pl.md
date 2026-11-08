# Karty serwerowe Home Assistant — dokumentacja polska

[Français](README.md) | [English](README.en.md) | **Polski**

Zestaw **14 niezależnych kart Lovelace Home Assistant** w jednym pliku JavaScript (`serveur-ha-card.js`). Karty umożliwiają monitorowanie hosta Home Assistant, urządzeń sieciowych, serwerów, pamięci masowej, aktualizacji i multimediów. Wizualnie nawiązują do MyElectricalData (motyw granatowy, jasny lub natywny motyw Home Assistant).

Wersja projektu obejmuje **trzy języki interfejsu: francuski (`fr`), angielski (`en`) i polski (`pl`)**. Francuski pozostaje językiem oryginalnym. Ustawienia, encje, automatyczne wykrywanie czujników i działanie funkcji nie zależą od wybranego języka interfejsu.

## Dostępne karty

| Typ karty | Przeznaczenie |
| --- | --- |
| `custom:serveur-ha-card` | Host Home Assistant / Raspberry Pi / mini-PC: CPU, temperatura, RAM, dyski, ruch sieciowy, czas pracy, wentylator, zasilanie i kopie zapasowe |
| `custom:serveur-ha-maj-card` | Home Assistant: aktualizacje Core, Supervisor, OS i dodatków, rozmiar bazy danych, ważność SSL |
| `custom:serveur-ha-nas-card` | NAS Synology: woluminy, dyski/SMART, CPU, RAM, temperatury, wentylator, sieć, UPS i sterowanie zasilaniem |
| `custom:serveur-ha-dns-card` | AdGuard Home i Pi-hole: zapytania DNS, odsetek zablokowanych, czasy odpowiedzi, ochrona, ustawienia i aktualizacje |
| `custom:serveur-ha-linux-card` | Linux Update Dashboard: oczekujące aktualizacje systemu i bezpieczeństwa, pakiety, wymagany restart |
| `custom:serveur-ha-proxmox-card` | Proxmox VE: węzły, magazyny danych, VM i kontenery LXC, aktualizacje i sterowanie maszynami |
| `custom:serveur-ha-asus-card` | Router ASUS (AsusRouter): Internet, IP publiczne, Wi-Fi, Ethernet, urządzenia, VPN i firmware |
| `custom:serveur-ha-ping-card` | Ping / ICMP: online/offline, opóźnienia, jitter, utrata pakietów, grupowanie według typu lub pomieszczenia |
| `custom:serveur-ha-zigbee-card` | Zigbee, Zigbee2MQTT i ZHA: słabe baterie, urządzenia offline, jakość połączenia, stan bramki |
| `custom:serveur-ha-wireguard-card` | WireGuard / WGDashboard: serwery, połączone peery, handshake, transfer danych |
| `custom:serveur-ha-glances-card` | Glances: CPU, RAM, dyski, temperatury, wentylatory, sieć i procesy |
| `custom:serveur-ha-media-card` | Plex, Jellyfin i Emby: odtwarzanie, odtwarzacze, sterowanie i biblioteki |
| `custom:serveur-ha-omv-card` | OpenMediaVault: czas pracy, CPU, RAM, dyski SMART, systemy plików, usługi i sterowanie zasilaniem |
| `custom:serveur-ha-github-card` | GitHub (beta): otwarte issues i pull requesty, nowe wpisy i aktywność według repozytoriów |

Dawna karta OPNsense ma odrębne repozytorium: [opnsense-card](https://github.com/Marlboro62/opnsense-card). Stara nazwa wyświetla informację o migracji.

## Instalacja

### HACS

1. Otwórz **HACS** i wyszukaj **Cartes Serveur HA**.
2. Zainstaluj kartę i odśwież interfejs przeglądarki (`Ctrl+F5`).
3. Jeśli repozytorium nie jest dostępne na liście, otwórz **HACS → ⋮ → Repozytoria niestandardowe**, dodaj `https://github.com/Marlboro62/serveur-ha-card` i wybierz kategorię **Dashboard**.

Jeżeli polskie tłumaczenie jest dostępne wyłącznie w Twoim forku i nie zostało jeszcze połączone z repozytorium autora, zainstaluj plik ręcznie albo wskaż własne repozytorium. Instalacja oryginalnej wersji z HACS nie pobierze nieopublikowanych zmian z forka.

### Instalacja ręczna

1. Skopiuj `serveur-ha-card.js` do `/config/www/` (w Home Assistant adres `/local/serveur-ha-card.js`).
2. W **Ustawienia → Panele → Zasoby** dodaj adres `/local/serveur-ha-card.js` jako **moduł JavaScript**.
3. Odśwież interfejs (`Ctrl+F5`), ewentualnie wyczyść pamięć podręczną przeglądarki.

Nie dodawaj jednocześnie dwóch zasobów JS rejestrujących te same karty — np. wersji HACS i lokalnej — pod różnymi adresami.

## Konfiguracja języka

Każda karta obsługuje właściwość YAML `language`. Można też wybrać język z listy **Język** w edytorze wizualnym.

**Automatyczne wykrywanie języka Home Assistant (domyślne):**

```yaml
type: custom:serveur-ha-card
language: auto
```

**Wymuszenie języka polskiego:**

```yaml
type: custom:serveur-ha-nas-card
language: pl
```

**Angielski i francuski:**

```yaml
type: custom:serveur-ha-proxmox-card
language: en
```

```yaml
type: custom:serveur-ha-dns-card
language: fr
```

| `language` | Zachowanie |
| --- | --- |
| `auto` | `pl` / `pl-PL` → polski; `fr` / `fr-*` → francuski; `en` i pozostałe języki → angielski |
| `pl` | Polski interfejs, edytor i formatowanie liczb/daty (`pl-PL`) |
| `en` | Angielski interfejs i formatowanie (`en-GB`) |
| `fr` | Oryginalny francuski interfejs i formatowanie (`fr-FR`) |

Każda karta może mieć inną wersję językową. Język wyświetlania nie zmienia identyfikatorów encji, kluczy YAML, żądań API ani nazw usług Home Assistant.

## Ustawienia wspólne

| Opcja | Opis | Domyślnie |
| --- | --- | --- |
| `language` | `auto`, `pl`, `en` lub `fr` | `auto` |
| `theme` | `v2` (granatowy), `auto` (jasny/ciemny zgodnie z HA), `ha` (motyw HA) | `v2` |
| `text_size` | Skala całej karty w zakresie 70–200% | `100` |
| `title` | Własny tytuł karty (jeśli obsługiwany) | Zależnie od karty |
| `icon`, `icon_color` | Ikona nagłówka i jej kolor (jeśli obsługiwane) | Zależnie od karty |

Przykład:

```yaml
type: custom:serveur-ha-dns-card
language: pl
theme: auto
text_size: 110
```

## Przykłady wybranych kart

**Serwer Home Assistant:**

```yaml
type: custom:serveur-ha-card
language: pl
title: Raspberry Pi 4
icon: mdi:raspberry-pi
ram_total: 3800
show_info: true
show_resources: true
show_network: true
show_power: true
show_backup: true
show_fan: true # false ukrywa wentylator
```

**Aktualizacje Home Assistant:**

```yaml
type: custom:serveur-ha-maj-card
language: pl
include_hacs: true
include_devices: false
updates_first: true
```

**NAS Synology:**

```yaml
type: custom:serveur-ha-nas-card
language: pl
title: Synology DS214+
volume_name: HDD 4 TB
show_ups: true
```

**Proxmox VE:**

```yaml
type: custom:serveur-ha-proxmox-card
language: pl
nodes:
  - pve1
sort: status
hide_stopped: false
```

**Ping / ICMP:**

```yaml
type: custom:serveur-ha-ping-card
language: pl
```

**Zigbee i baterie:**

```yaml
type: custom:serveur-ha-zigbee-card
language: pl
```

**OpenMediaVault:**

```yaml
type: custom:serveur-ha-omv-card
language: pl
```

**GitHub:**

```yaml
type: custom:serveur-ha-github-card
language: pl
user: Marlboro62
types: all
```

## Automatyczne wykrywanie czujników

Karty automatycznie wyszukują encje z integracji Home Assistant, m.in.: **System Monitor, Backup, Synology DSM, Proxmox VE, AsusRouter, Ping, AdGuard Home, Pi-hole, Zigbee2MQTT/ZHA, Glances, WGDashboard, Plex, Jellyfin, Emby oraz OpenMediaVault**. W części kart można podać konkretne encje lub urządzenia w YAML, jeśli automatyczne wykrywanie nie jest wystarczające.

Nazwy i identyfikatory czujników mogą być francuskie lub angielskie. Polskie tłumaczenie interfejsu **nie zmienia reguł wykrywania**.

Szczegółowe ustawienia każdej karty, zależności od konkretnych integracji, progi alarmowe i komplet przykładów znajdują się w [oryginalnej dokumentacji francuskiej](README.md) lub [angielskiej dokumentacji](README.en.md).

## Uwagi

- Zmiany języka nie powinny wpływać na funkcje sterowania urządzeniami. Niektóre działania wymagają potwierdzenia drugim kliknięciem, tak jak w oryginale.
- Domyślne nazwy urządzeń, tytuły ustawione przez użytkownika i wartości atrybutów encji nie są osobnymi tłumaczeniami — mogą pozostać w języku źródłowym.
- Zmiany przetestowano pod kątem składni i symulowanego renderowania, ale przed publikacją warto zweryfikować karty w rzeczywistej instalacji Home Assistant.
