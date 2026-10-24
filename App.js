import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';

const STORAGE_KEYS = { events: '@role-perto/events-v3', saved: '@role-perto/saved-v3', location: '@role-perto/location-v3', radius: '@role-perto/radius-v3', region: '@role-perto/region-v3', auth: '@role-perto/supabase-auth-v1' };
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
// SUPABASE_KEY aceita a chave Publishable atual (sb_publishable_...).
// Mantemos ANON_KEY como compatibilidade com projetos que ainda usam a chave legada.
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const CATEGORIES = ['Tudo', 'Gastronomia', 'Música', 'Festas', 'Feiras', 'Cultura', 'Esportes'];
const BRAZIL_STATES = [
  { code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' }, { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' }, { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' }, { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' }, { code: 'MT', name: 'Mato Grosso' }, { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' }, { code: 'PA', name: 'Pará' }, { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' }, { code: 'PE', name: 'Pernambuco' }, { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' }, { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' }, { code: 'RR', name: 'Roraima' }, { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' }, { code: 'SE', name: 'Sergipe' }, { code: 'TO', name: 'Tocantins' }
];
const COLORS = ['#FFE1B8', '#D9D9E0', '#C9F2DE', '#FFD8E7', '#F7E7A9'];
const SEED_EVENTS = [
  { id: 'seed-1', title: 'Festival de Hambúrguer', category: 'Gastronomia', venue: 'Mercado Central', neighborhood: 'Asa Sul', date: 'Hoje · 18h–23h', price: 'Entrada grátis', emoji: '🍔', color: COLORS[0], description: 'Comida boa, música ao vivo e opções para reunir os amigos. Consulte os preços dos pratos no local.', address: 'Setor Comercial Sul, Brasília - DF', latitude: -15.7975, longitude: -47.8919, demo: true },
  { id: 'seed-2', title: 'Samba no Terraço', category: 'Música', venue: 'Terraço 61', neighborhood: 'Plano Piloto', date: 'Hoje · 20h', price: 'A partir de R$ 25', emoji: '🎶', color: COLORS[1], description: 'Uma noite de samba, artistas locais e clima descontraído. Ingressos sujeitos à disponibilidade.', address: 'Asa Norte, Brasília - DF', latitude: -15.7582, longitude: -47.8825, demo: true },
  { id: 'seed-3', title: 'Feira Criativa & Brechó', category: 'Feiras', venue: 'Praça das Artes', neighborhood: 'Asa Norte', date: 'Sáb · 10h', price: 'Grátis', emoji: '🛍️', color: COLORS[2], description: 'Moda circular, artesanato, arte independente e pequenos negócios locais.', address: 'Asa Norte, Brasília - DF', latitude: -15.7508, longitude: -47.8834, demo: true },
  { id: 'seed-4', title: 'Noite Indie', category: 'Festas', venue: 'Subsolo Club', neighborhood: 'Sudoeste', date: 'Sáb · 22h', price: 'A partir de R$ 30', emoji: '🪩', color: COLORS[3], description: 'DJ sets e sons alternativos até tarde. Confira classificação etária e regras da casa.', address: 'Sudoeste, Brasília - DF', latitude: -15.7987, longitude: -47.9252, demo: true },
  { id: 'seed-5', title: 'Brunch de Domingo', category: 'Gastronomia', venue: 'Jardim Café', neighborhood: 'Lago Sul', date: 'Dom · 9h', price: 'Consumo no local', emoji: '🥐', color: COLORS[4], description: 'Brunch com cafés especiais, pães artesanais e mesas ao ar livre. Reserve diretamente com o estabelecimento.', address: 'Lago Sul, Brasília - DF', latitude: -15.8342, longitude: -47.8758, demo: true },
  { id: 'seed-6', title: 'Cinema ao Ar Livre', category: 'Cultura', venue: 'Praça do Museu', neighborhood: 'Eixo Monumental', date: 'Sex · 19h30', price: 'Grátis', emoji: '🎬', color: COLORS[1], description: 'Sessão de cinema ao ar livre para reunir amigos e família. Leve uma canga ou cadeira. Evento demonstrativo para testes.', address: 'Eixo Monumental, Brasília - DF', latitude: -15.7835, longitude: -47.8990, demo: true },
  { id: 'seed-7', title: 'Aulão de Funcional no Parque', category: 'Esportes', venue: 'Parque da Cidade', neighborhood: 'Asa Sul', date: 'Sáb · 8h', price: 'Grátis', emoji: '🏃', color: COLORS[2], description: 'Atividade física em grupo ao ar livre. Leve água e use roupas confortáveis. Evento demonstrativo para testes.', address: 'Parque da Cidade Sarah Kubitschek, Brasília - DF', latitude: -15.8021, longitude: -47.9125, demo: true },
  { id: 'seed-8', title: 'Festival de Comida de Rua', category: 'Gastronomia', venue: 'Praça da Feira', neighborhood: 'Guará', date: 'Sáb · 16h–22h', price: 'Entrada grátis', emoji: '🌮', color: COLORS[0], description: 'Barracas com opções variadas de comida, sobremesas e bebidas. Os consumos são pagos diretamente aos expositores. Evento demonstrativo para testes.', address: 'Guará II, Brasília - DF', latitude: -15.8270, longitude: -47.9765, demo: true },
  { id: 'seed-9', title: 'Noite de Forró', category: 'Música', venue: 'Casa do Baião', neighborhood: 'Águas Claras', date: 'Sáb · 21h', price: 'A partir de R$ 20,00', emoji: '🪗', color: COLORS[3], description: 'Forró pé de serra e espaço para dançar. Consulte a classificação etária e disponibilidade. Evento demonstrativo para testes.', address: 'Águas Claras, Brasília - DF', latitude: -15.8394, longitude: -48.0261, demo: true },
  { id: 'seed-10', title: 'Feira de Artesanato Local', category: 'Feiras', venue: 'Praça da Igreja', neighborhood: 'Cruzeiro', date: 'Dom · 9h–15h', price: 'Grátis', emoji: '🧶', color: COLORS[4], description: 'Artesanato, presentes feitos à mão e produtos de pequenos empreendedores locais. Evento demonstrativo para testes.', address: 'Cruzeiro, Brasília - DF', latitude: -15.7904, longitude: -47.9392, demo: true },
  { id: 'seed-11', title: 'Jazz no Fim da Tarde', category: 'Música', venue: 'Deck do Lago', neighborhood: 'Lago Norte', date: 'Dom · 17h', price: 'A partir de R$ 15,00', emoji: '🎷', color: COLORS[1], description: 'Apresentação musical intimista com repertório de jazz e mesas ao ar livre. Evento demonstrativo para testes.', address: 'Lago Norte, Brasília - DF', latitude: -15.7270, longitude: -47.8580, demo: true },
  { id: 'seed-12', title: 'Oficina de Cerâmica', category: 'Cultura', venue: 'Ateliê Aberto', neighborhood: 'Asa Norte', date: 'Dom · 14h', price: 'R$ 40,00', emoji: '🏺', color: COLORS[2], description: 'Oficina introdutória para experimentar técnicas básicas de cerâmica. Vagas limitadas; evento demonstrativo para testes.', address: 'Asa Norte, Brasília - DF', latitude: -15.7446, longitude: -47.8871, demo: true }
];
function mapDeltasForRadius(radiusKm, latitude = -15.8) {
  // O filtro de raio também controla o enquadramento: antes, o filtro mudava
  // para 50 km, mas o mapa continuava ampliado em poucos quilômetros.
  const latitudeDelta = Math.min(2.5, Math.max(0.045, (Number(radiusKm) * 2.2) / 111));
  const longitudeDelta = Math.min(2.5, latitudeDelta / Math.max(0.25, Math.cos((latitude * Math.PI) / 180)));
  return { latitudeDelta, longitudeDelta };
}
function distanceKm(aLat, aLon, bLat, bLon) {
  if (![aLat, aLon, bLat, bLon].every(v => typeof v === 'number' && Number.isFinite(v))) return null;
  const rad = v => v * Math.PI / 180; const dLat = rad(bLat - aLat); const dLon = rad(bLon - aLon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function maskDateInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function maskTimeInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
function currencyInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function validDateTime(date, time) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
  const [day, month, year] = date.split('/').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
function formatEventDate(date, time) {
  return `${date} às ${time}`;
}
function eventIdentity(event) {
  return [event?.title, event?.venue, event?.date || event?.event_date]
    .map(value => String(value || '').trim().toLocaleLowerCase('pt-BR'))
    .join('|');
}
async function geocodeEventLocation(candidates) {
  const uniqueCandidates = [...new Set(candidates.map(value => String(value || '').trim()).filter(Boolean))];
  for (const address of uniqueCandidates) {
    try {
      const results = await Location.geocodeAsync(address);
      const point = results?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude));
      if (point) return { latitude: point.latitude, longitude: point.longitude, matchedAddress: address };
    } catch (error) {
      console.warn('[ProjectXGeocoding] falha ao localizar endereço:', address, error?.message || error);
    }
  }
  return null;
}

async function geocodeEventLocationInCity(candidates, city, stateName) {
  // Resolve a cidade selecionada primeiro, para impedir que um endereço
  // incompleto ou ambíguo mova o marcador para outra região.
  let cityAnchor = null;
  for (const query of [`${city}, ${stateName}, Brasil`, `${city}, Brasil`]) {
    try {
      const results = await Location.geocodeAsync(query);
      const point = results?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude));
      if (point) { cityAnchor = { latitude: point.latitude, longitude: point.longitude, matchedAddress: query }; break; }
    } catch (error) {
      console.warn('[ProjectXGeocoding] falha ao localizar cidade de referência:', query, error?.message || error);
    }
  }
  if (!cityAnchor) {
    const fallback = await geocodeEventLocation(candidates);
    return fallback ? { ...fallback, usedCityFallback: false } : null;
  }
  const uniqueCandidates = [...new Set(candidates.map(value => String(value || '').trim()).filter(Boolean))];
  for (const address of uniqueCandidates) {
    try {
      const results = await Location.geocodeAsync(address);
      const point = results?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude)
        && distanceKm(cityAnchor.latitude, cityAnchor.longitude, item.latitude, item.longitude) <= 60);
      if (point) return { latitude: point.latitude, longitude: point.longitude, matchedAddress: address, usedCityFallback: false };
    } catch (error) {
      console.warn('[ProjectXGeocoding] falha ao validar endereço:', address, error?.message || error);
    }
  }
  // Se o endereço não for localizado com segurança, usa o ponto da cidade.
  return { ...cityAnchor, usedCityFallback: true };
}
function Pill({ label, active, onPress }) { return <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text></TouchableOpacity>; }
function EventCard({ event, onPress, isSaved = false, onToggleSave, hasUserLocation }) {
  const distance = event.distanceKm;
  const distanceLabel = distance == null ? (hasUserLocation ? 'Sem coordenadas' : 'Ative localização') : `${distance.toFixed(1).replace('.', ',')} km`;
  return <View style={styles.eventCard}><TouchableOpacity activeOpacity={0.86} style={styles.eventCardMain} onPress={onPress}>
    <View style={[styles.eventArt, { backgroundColor: event.color || '#D9D9E0' }]}><Text style={styles.eventEmoji}>{event.emoji || '✨'}</Text><View style={styles.distanceBadge}><Text style={styles.distanceText}>{distanceLabel}</Text></View></View>
    <View style={styles.eventInfo}><View style={styles.eventTopLine}><Text style={styles.eventCategory}>{(event.category || 'Eventos').toUpperCase()}</Text>{onToggleSave ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={isSaved ? 'Remover dos salvos' : 'Salvar evento'} onPress={onToggleSave} style={styles.cardHeart}><Text style={[styles.cardHeartText, isSaved && styles.cardHeartActive]}>{isSaved ? '♥' : '♡'}</Text></TouchableOpacity> : null}</View>
    <Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventMeta}>{event.venue} · {event.neighborhood}</Text><View style={styles.eventBottom}><Text style={styles.eventDate}>{event.date}</Text><Text style={styles.eventPrice}>{event.price}</Text></View></View>
  </TouchableOpacity></View>;
}
async function getSupabaseAccessToken() {
  const saved = await AsyncStorage.getItem(STORAGE_KEYS.auth);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.access_token && parsed.expires_at > Date.now() + 60000) return parsed.access_token;
      if (parsed.refresh_token) {
        const refreshed = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: parsed.refresh_token })
        });
        if (refreshed.ok) {
          const auth = await refreshed.json();
          if (auth.access_token) {
            await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({
              access_token: auth.access_token, refresh_token: auth.refresh_token || parsed.refresh_token,
              expires_at: Date.now() + (auth.expires_in || 3600) * 1000
            }));
            return auth.access_token;
          }
        }
      }
    } catch (_) {}
  }
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/signup`, {
    method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { app: 'role-perto' } })
  });
  if (!response.ok) throw new Error(`Não foi possível iniciar sessão anônima (${response.status}). Ative Anonymous Sign-Ins no Supabase.`);
  const auth = await response.json();
  if (!auth.access_token) throw new Error('O Supabase não retornou token de acesso. Confira se o login anônimo está habilitado.');
  await AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({
    access_token: auth.access_token, refresh_token: auth.refresh_token || null,
    expires_at: Date.now() + (auth.expires_in || 3600) * 1000
  }));
  return auth.access_token;
}
async function supabaseRequest(path, options = {}, accessToken = null) {
  // A Publishable key vai no cabeçalho apikey; Authorization recebe um JWT de sessão.
  const token = accessToken || await getSupabaseAccessToken();
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, { ...options, headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  const text = await response.text(); return text ? JSON.parse(text) : null;
}

export default function App() {
  const mapRef = React.useRef(null);
  const [tab, setTab] = useState('Explorar'); const [category, setCategory] = useState('Tudo'); const [query, setQuery] = useState('');
  const [storageHydrated, setStorageHydrated] = useState(false); const [showMyAds, setShowMyAds] = useState(false);
  const [events, setEvents] = useState(SEED_EVENTS); const [savedIds, setSavedIds] = useState([]); const [selected, setSelected] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Brasília, DF'); const [userCoords, setUserCoords] = useState(null); const [radius, setRadius] = useState(10);
  const [manualRegion, setManualRegion] = useState(''); const [showEventPanel, setShowEventPanel] = useState(false); const [loadingLocation, setLoadingLocation] = useState(false); const [syncStatus, setSyncStatus] = useState(HAS_SUPABASE ? 'Conectando à nuvem…' : 'Modo local'); const [refreshingEvents, setRefreshingEvents] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Gastronomia', venue: '', neighborhood: '', address: '', date: '', price: '', description: '' });
  const [selectedUF, setSelectedUF] = useState(null);
  const [showUFOptions, setShowUFOptions] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [showEventMapPicker, setShowEventMapPicker] = useState(false);
  const [selectedEventCoords, setSelectedEventCoords] = useState(null);
  const [eventMapRegion, setEventMapRegion] = useState(null);
  const [eventMapSearchText, setEventMapSearchText] = useState('');
  const [searchingEventMapAddress, setSearchingEventMapAddress] = useState(false);
  const [locatingEventMapUser, setLocatingEventMapUser] = useState(false);
  const eventMapRef = useRef(null);
  const [eventDateInput, setEventDateInput] = useState('');
  const [eventTimeInput, setEventTimeInput] = useState('');
  const [priceIsFree, setPriceIsFree] = useState(false);
  const [locationFixFor, setLocationFixFor] = useState(null);
  const [locationFixText, setLocationFixText] = useState('');
  const [savingLocationFix, setSavingLocationFix] = useState(false);

  useEffect(() => { (async () => {
    try {
      const [storedEvents, storedSaved, storedLocation, storedRadius, storedRegion] = await Promise.all([AsyncStorage.getItem(STORAGE_KEYS.events), AsyncStorage.getItem(STORAGE_KEYS.saved), AsyncStorage.getItem(STORAGE_KEYS.location), AsyncStorage.getItem(STORAGE_KEYS.radius), AsyncStorage.getItem(STORAGE_KEYS.region)]);
      if (storedEvents) { const parsedEvents = JSON.parse(storedEvents); const knownIds = new Set(parsedEvents.map(e => String(e.id))); const mergedEvents = [...parsedEvents, ...SEED_EVENTS.filter(e => !knownIds.has(String(e.id)))]; setEvents(mergedEvents); } if (storedSaved) setSavedIds(JSON.parse(storedSaved));
      if (storedLocation) { const loc = JSON.parse(storedLocation); setUserCoords(loc.coords || null); setLocationLabel(loc.label || 'Perto de você'); }
      if (storedRadius) setRadius(Number(storedRadius)); if (storedRegion) setManualRegion(storedRegion);
    } catch (e) { console.warn('Não foi possível restaurar os dados locais', e); }
    finally { setStorageHydrated(true); }
    if (HAS_SUPABASE) syncFromCloud();
  })(); }, []);
  useEffect(() => { if (userCoords && mapRef.current) mapRef.current.animateToRegion({ latitude: userCoords.latitude, longitude: userCoords.longitude, ...mapDeltasForRadius(radius, userCoords.latitude) }, 350); }, [userCoords, radius]);
  useEffect(() => {
    let cancelled = false;
    if (!selectedUF) { setMunicipalities([]); setSelectedCity(''); setCityQuery(''); setShowCityOptions(false); return; }
    setMunicipalities([]); setSelectedCity(''); setCityQuery(''); setShowCityOptions(false); setLoadingMunicipalities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF.code}/municipios?orderBy=nome`)
      .then(response => { if (!response.ok) throw new Error(`IBGE ${response.status}`); return response.json(); })
      .then(data => { if (!cancelled) setMunicipalities(Array.isArray(data) ? data.map(item => item.nome) : []); })
      .catch(error => { console.warn('[ProjectXAddress] falha ao carregar municípios do IBGE:', error?.message || error); if (!cancelled) setMunicipalities([]); })
      .finally(() => { if (!cancelled) setLoadingMunicipalities(false); });
    return () => { cancelled = true; };
  }, [selectedUF?.code]);
  useEffect(() => {
    let cancelled = false;
    if (!selectedCity || !selectedUF) { setEventMapRegion(null); setSelectedEventCoords(null); return; }
    (async () => {
      try {
        const results = await Location.geocodeAsync(`${selectedCity}, ${selectedUF.name}, Brasil`);
        const point = results?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude));
        if (!cancelled && point) setEventMapRegion({ latitude: point.latitude, longitude: point.longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 });
      } catch (error) { console.warn('[ProjectXAddress] não foi possível centralizar o seletor no município:', error?.message || error); }
    })();
    return () => { cancelled = true; };
  }, [selectedCity, selectedUF?.code]);
  // Do not persist initial demo state until the first AsyncStorage read has completed.
  // Otherwise the initial render can overwrite announcements saved from a previous session.
  useEffect(() => { if (storageHydrated) AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events)).catch(e => console.warn('Falha ao salvar anúncios localmente', e)); }, [events, storageHydrated]);
  useEffect(() => { if (storageHydrated) AsyncStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(savedIds)).catch(() => {}); }, [savedIds, storageHydrated]);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.radius, String(radius)).catch(() => {}); }, [radius]);

  const syncFromCloud = async () => {
    if (!HAS_SUPABASE || refreshingEvents) return;
    setRefreshingEvents(true);
    setSyncStatus('Atualizando anúncios…');
    try {
      const data = await supabaseRequest('events?select=*&status=eq.published&order=created_at.desc');
      const cloudEvents = (data || []).map(row => ({ ...row, id: String(row.id), venue: row.venue, neighborhood: row.neighborhood || '', date: row.event_date || row.date_label || 'Data a confirmar', price: row.price_label || 'Consulte o organizador', latitude: row.latitude == null ? null : Number(row.latitude), longitude: row.longitude == null ? null : Number(row.longitude), emoji: row.emoji || '✨', color: row.color || '#D9D9E0', description: row.description || '', address: row.address || '' }));
      setEvents(current => {
        const localEntries = current.filter(e => e.demo || String(e.id).startsWith('local-'));
        // Um anúncio recém-criado existe localmente e na nuvem. Mantemos a cópia
        // local (para continuar em “Meus anúncios”) e evitamos duplicar o marcador.
        const localIdentities = new Set(localEntries.filter(e => !e.demo).map(eventIdentity));
        const nonDuplicateCloud = cloudEvents.filter(e => !localIdentities.has(eventIdentity(e)));
        const merged = [...nonDuplicateCloud, ...localEntries];
        const unique = new Map(); merged.forEach(e => unique.set(String(e.id), e));
        return Array.from(unique.values());
      });
      setSyncStatus('Sincronizado com a nuvem');
    } catch (e) { console.warn('Falha na sincronização Supabase', e.message); setSyncStatus('Nuvem indisponível · dados locais'); }
    finally { setRefreshingEvents(false); }
  };
  const filtered = useMemo(() => {
    let list = events.filter(e => (category === 'Tudo' || e.category === category) && `${e.title} ${e.venue} ${e.neighborhood} ${e.city || ''} ${e.state || ''} ${e.address || ''} ${e.category} ${e.description || ''}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
    list = list.map(e => ({ ...e, distanceKm: userCoords ? distanceKm(userCoords.latitude, userCoords.longitude, e.latitude, e.longitude) : null }));
    if (userCoords) list = list.filter(e => e.distanceKm == null || e.distanceKm <= radius).sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return list;
  }, [events, category, query, userCoords, radius]);
  const savedEvents = useMemo(() => events.filter(e => savedIds.includes(String(e.id))).map(e => ({ ...e, distanceKm: userCoords ? distanceKm(userCoords.latitude, userCoords.longitude, e.latitude, e.longitude) : null })), [events, savedIds, userCoords]);
  const myAds = useMemo(() => events.filter(e => String(e.id).startsWith('local-')).map(e => ({ ...e, distanceKm: userCoords ? distanceKm(userCoords.latitude, userCoords.longitude, e.latitude, e.longitude) : null })), [events, userCoords]);
  const toggleSaved = eventId => setSavedIds(current => current.includes(String(eventId)) ? current.filter(id => id !== String(eventId)) : [...current, String(eventId)]);
  const deleteMyAd = async (eventId) => {
    const updated = events.filter(e => String(e.id) !== String(eventId));
    setEvents(updated);
    try { await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updated)); }
    catch (e) { Alert.alert('Não foi possível excluir', 'O anúncio não foi removido do armazenamento local. Tente novamente.'); }
  };
  const repairAdLocation = async event => {
    const address = locationFixText.trim();
    if (!address) { Alert.alert('Informe o endereço', 'Digite bairro, cidade e estado para localizar o evento.'); return; }
    setSavingLocationFix(true);
    try {
      const point = await geocodeEventLocation([address, `${event.venue}, ${address}`]);
      if (!point) {
        Alert.alert('Endereço não encontrado', 'Não conseguimos obter coordenadas. Tente informar rua, bairro, cidade e UF.');
        return;
      }
      const updated = events.map(item => String(item.id) === String(event.id)
        ? { ...item, address, latitude: point.latitude, longitude: point.longitude }
        : item);
      setEvents(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updated));
      let cloudUpdated = false;
      if (HAS_SUPABASE) {
        try {
          const filters = `events?title=eq.${encodeURIComponent(event.title)}&venue=eq.${encodeURIComponent(event.venue)}&event_date=eq.${encodeURIComponent(event.date || event.event_date)}`;
          await supabaseRequest(filters, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ address, latitude: point.latitude, longitude: point.longitude })
          });
          cloudUpdated = true;
        } catch (error) {
          console.warn('[ProjectXGeocoding] coordenadas salvas localmente; atualização da nuvem falhou:', error?.message || error);
        }
      }
      setLocationFixFor(null);
      setLocationFixText('');
      Alert.alert('Localização atualizada', cloudUpdated || !HAS_SUPABASE
        ? 'As coordenadas foram salvas. Se o evento estiver fora do raio atual, busque a cidade/bairro na tela Explorar.'
        : 'As coordenadas foram salvas neste aparelho, mas não conseguimos atualizar a cópia na nuvem. Confira a conexão e tente sincronizar novamente.');
    } catch (error) {
      Alert.alert('Não foi possível corrigir', `Tente novamente. ${error?.message || ''}`);
    } finally {
      setSavingLocationFix(false);
    }
  };

  const applyCoordinates = async (coords, labelOverride = null) => {
    // Keep this path independent of reverse geocoding. The previous build still
    // called reverseGeocodeAsync and failed while converting its native result.
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      throw new Error('A localização não retornou latitude e longitude válidas.');
    }
    const latitude = coords.latitude;
    const longitude = coords.longitude;
    const label = labelOverride || 'Perto de você';
    setUserCoords({ latitude: latitude, longitude: longitude });
    setLocationLabel(label);
    await AsyncStorage.setItem(
      STORAGE_KEYS.location,
      JSON.stringify({
        coords: { latitude: latitude, longitude: longitude },
        label: label
      })
    );
  };
  const locate = async () => {
    setLoadingLocation(true);
    try {
      // Check the existing permission first: on iOS, requesting again can obscure
      // whether the real failure is permission, services, or a slow GPS fix.
      console.info('[RolePertoLocation] etapa=verificar-permissao');
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        console.info('[RolePertoLocation] etapa=solicitar-permissao');
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permissão de localização',
          'O iPhone não concedeu acesso à localização. Em Ajustes > Privacidade e Segurança > Serviços de Localização, confirme que os serviços estão ativos e que o Expo Go pode acessar sua localização. Você também pode buscar uma região manualmente.'
        );
        return;
      }
      console.info('[RolePertoLocation] etapa=verificar-servicos');
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Serviços de localização desativados',
          'A permissão do Expo Go está concedida, mas os Serviços de Localização do iPhone estão desligados. Ative Ajustes > Privacidade e Segurança > Serviços de Localização e tente novamente.'
        );
        return;
      }
      // Always pass an explicit options object to the iOS native bridge.
      // In some Expo Go/native-module combinations, omitting it reaches native
      // code as undefined and can produce: Cannot convert undefined value to object.
      console.info('[RolePertoLocation] etapa=obter-posicao-atual');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true
      });
      const coords = loc && loc.coords;
      if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
        throw new Error('O serviço de localização não retornou latitude e longitude válidas.');
      }
      console.info('[RolePertoLocation] etapa=aplicar-coordenadas');
      await applyCoordinates(coords);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        ...mapDeltasForRadius(radius, loc.coords.latitude)
      }, 500);
    } catch (error) {
      const message = String(error?.message || error || '');
      console.warn('[RolePertoLocation] falha:', message, error?.stack || '');
      const isTimeout = /timeout|timed out|location unavailable|position unavailable/i.test(message);
      Alert.alert(
        isTimeout ? 'Localização demorou para responder' : 'Não foi possível obter a localização',
        isTimeout
          ? 'A permissão está concedida, mas o iPhone não retornou uma posição a tempo. Tente novamente em uma área aberta, confirme que os Serviços de Localização estão ativos ou escolha uma região manualmente.'
          : `A permissão pode estar concedida, mas o sistema não conseguiu obter a posição${message ? ` (${message})` : ''}. Confirme os Serviços de Localização do iPhone ou busque uma região manualmente.`
      );
    } finally {
      setLoadingLocation(false);
    }
  };
  const searchRegion = async () => {
    if (!manualRegion.trim()) { Alert.alert('Digite uma região', 'Ex.: Asa Sul, Brasília - DF'); return; }
    setLoadingLocation(true);
    try { const results = await Location.geocodeAsync(manualRegion.trim()); if (!results.length) { Alert.alert('Região não encontrada', 'Tente informar bairro, cidade e estado.'); return; }
      await applyCoordinates(results[0], manualRegion.trim()); mapRef.current?.animateToRegion({ latitude: results[0].latitude, longitude: results[0].longitude, ...mapDeltasForRadius(radius, results[0].latitude) }, 500); await AsyncStorage.setItem(STORAGE_KEYS.region, manualRegion.trim()); Alert.alert('Região definida', `O mapa foi centralizado em ${manualRegion.trim()} e ajustado para mostrar a área de ${radius} km. Se um anúncio tiver coordenadas incorretas, use “Ajustar localização do mapa” em Meus anúncios.`);
    } catch { Alert.alert('Falha na busca', 'Não foi possível localizar essa região agora. Verifique a conexão e tente novamente.'); }
    finally { setLoadingLocation(false); }
  };
  const openMap = event => { const q = typeof event.latitude === 'number' && typeof event.longitude === 'number' ? `${event.latitude},${event.longitude}` : (event.address || `${event.venue}, ${event.neighborhood}, Brasília`); Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`); };

  const centerEventMapAt = (latitude, longitude, delta = 0.012) => {
    const region = { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta };
    setEventMapRegion(region);
    eventMapRef.current?.animateToRegion(region, 450);
  };
  const searchEventMapAddress = async () => {
    const query = eventMapSearchText.trim();
    if (!query) { Alert.alert('Digite um endereço', 'Informe uma rua, endereço ou estabelecimento para pesquisar no mapa.'); return; }
    if (!selectedCity || !selectedUF) { Alert.alert('Selecione a cidade', 'Escolha primeiro o estado e a cidade do evento.'); return; }
    setSearchingEventMapAddress(true);
    try {
      const fullQuery = [query, neighborhoodInput.trim(), selectedCity, selectedUF.name, 'Brasil'].filter(Boolean).join(', ');
      const results = await Location.geocodeAsync(fullQuery);
      const cityResults = await Location.geocodeAsync(`${selectedCity}, ${selectedUF.name}, Brasil`);
      const cityAnchor = cityResults?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude));
      const point = results?.find(item => Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude)
        && (!cityAnchor || distanceKm(cityAnchor.latitude, cityAnchor.longitude, item.latitude, item.longitude) <= 60));
      if (!point) {
        Alert.alert('Endereço não encontrado', `Não encontramos esse endereço dentro da região de ${selectedCity} - ${selectedUF.code}. Tente incluir rua, número e bairro.`);
        return;
      }
      const coords = { latitude: point.latitude, longitude: point.longitude };
      setSelectedEventCoords(coords);
      centerEventMapAt(coords.latitude, coords.longitude, 0.008);
    } catch (error) {
      console.warn('[ProjectXAddress] falha na busca do seletor de mapa:', error?.message || error);
      Alert.alert('Falha na busca', 'Não foi possível pesquisar esse endereço agora. Verifique a conexão e tente novamente.');
    } finally { setSearchingEventMapAddress(false); }
  };
  const centerEventMapOnCurrentLocation = async () => {
    setLocatingEventMapUser(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão de localização', 'Permita o acesso à localização nas configurações do iPhone ou pesquise o endereço manualmente.');
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        Alert.alert('Localização desativada', 'Ative os Serviços de Localização do iPhone e tente novamente.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: true });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setSelectedEventCoords(coords);
      centerEventMapAt(coords.latitude, coords.longitude, 0.008);
    } catch (error) {
      console.warn('[ProjectXAddress] falha ao obter localização atual:', error?.message || error);
      Alert.alert('Localização indisponível', 'Não foi possível obter sua localização agora. Pesquise o endereço manualmente ou mova o marcador no mapa.');
    } finally { setLocatingEventMapUser(false); }
  };

  const publish = async (locationConfirmed = false) => {
    if (!form.title.trim() || !form.venue.trim()) { Alert.alert('Faltam informações', 'Preencha o nome do evento e o local.'); return; }
    if (!selectedUF) { Alert.alert('Selecione o estado', 'Escolha o estado antes de informar a localização do evento.'); return; }
    if (!selectedCity) { Alert.alert('Selecione a cidade', 'Pesquise e selecione a cidade do evento na lista de municípios do estado escolhido.'); return; }
    if (!validDateTime(eventDateInput, eventTimeInput)) { Alert.alert('Confira data e horário', 'Informe uma data válida no formato DD/MM/AAAA e o horário no formato HH:MM.'); return; }
    const eventDateLabel = formatEventDate(eventDateInput, eventTimeInput);
    const priceLabel = priceIsFree ? 'Gratuito' : (form.price.trim() ? `R$ ${form.price.trim()}` : 'Consulte o organizador');
    // Contextualiza todas as tentativas de geocodificação com a UF escolhida.
    // Isso reduz resultados homônimos em cidades ou estados diferentes.
    const enteredAddress = form.address.trim();
    const city = selectedCity.trim();
    const neighborhood = neighborhoodInput.trim();
    const regionText = [city, neighborhood].filter(Boolean).join(', ');
    const stateName = selectedUF.name;
    const stateCode = selectedUF.code;
    const locationCandidates = [
      [enteredAddress, regionText, stateName, 'Brasil'].filter(Boolean).join(', '),
      [form.venue.trim(), regionText, stateName, 'Brasil'].filter(Boolean).join(', '),
      [neighborhood, city, stateName, 'Brasil'].filter(Boolean).join(', '),
      [city, stateName, 'Brasil'].filter(Boolean).join(', '),
      [enteredAddress, city, stateCode, 'Brasil'].filter(Boolean).join(', '),
      [form.venue.trim(), city, stateCode, 'Brasil'].filter(Boolean).join(', ')
    ];
    const geocoded = selectedEventCoords
      ? { ...selectedEventCoords, usedCityFallback: false, matchedAddress: 'Ponto selecionado manualmente no mapa' }
      : await geocodeEventLocationInCity(locationCandidates, city, stateName);
    const coords = geocoded ? { latitude: geocoded.latitude, longitude: geocoded.longitude } : {};
    if (!locationConfirmed) {
      const locationSummary = geocoded
        ? `\n\nCoordenadas: ${geocoded.latitude.toFixed(5)}, ${geocoded.longitude.toFixed(5)}${selectedEventCoords ? '\nPonto escolhido no mapa.' : geocoded.usedCityFallback ? '\nPonto aproximado no centro da cidade.' : '\nPonto encontrado pelo endereço.'}`
        : '\n\nNão conseguimos localizar o endereço automaticamente. O anúncio poderá ficar sem marcador.';
      Alert.alert('Confirme a localização', `Confira se o ponto do evento está correto antes de publicar.${locationSummary}`, [
        { text: 'Revisar mapa', style: 'cancel', onPress: () => setShowEventMapPicker(true) },
        { text: 'Confirmar e publicar', onPress: () => { void publish(true); } }
      ]);
      return;
    }
    const address = [enteredAddress, regionText, stateName, 'Brasil'].filter(Boolean).join(', ') || [form.venue.trim(), regionText, stateName].filter(Boolean).join(', ');
    const neighborhoodLabel = [city, neighborhood, stateCode].filter(Boolean).join(' - ');
    const next = { ...form, date: eventDateLabel, price: priceLabel, id: `local-${Date.now()}`, neighborhood: neighborhoodLabel, city, state: stateCode, emoji: '✨', color: '#D9D9E0', description: form.description || 'Mais informações com o organizador.', address, ...coords, demo: false, status: 'published' };
    const updatedEvents = [next, ...events.filter(e => String(e.id) !== String(next.id))];
    setEvents(updatedEvents);
    try { await AsyncStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updatedEvents)); }
    catch (e) { console.warn('Falha ao persistir anúncio', e); Alert.alert('Aviso', 'O anúncio foi criado nesta sessão, mas não foi possível confirmar o salvamento no aparelho.'); }
    let cloudMessage = 'O evento foi salvo neste aparelho. Você poderá encontrá-lo em “Ver meus anúncios”. Para compartilhá-lo com outros usuários, configure o Supabase seguindo o README.';
    if (HAS_SUPABASE) {
      try {
        const row = { title: next.title, category: next.category, venue: next.venue, neighborhood: next.neighborhood, event_date: next.date, price_label: next.price, description: next.description, address: next.address, latitude: next.latitude ?? null, longitude: next.longitude ?? null, emoji: next.emoji, color: next.color, status: 'published' };
        await supabaseRequest('events', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) }); cloudMessage = 'O evento foi enviado ao banco de dados compartilhado. Ele aparecerá publicamente após passar pelas regras de publicação configuradas.'; syncFromCloud();
      } catch (e) { cloudMessage = `Salvo localmente, mas não foi possível publicar na nuvem: ${e.message}`; }
    }
    setForm({ title: '', category: 'Gastronomia', venue: '', neighborhood: '', address: '', date: '', price: '', description: '' }); setSelectedUF(null); setShowUFOptions(false); setMunicipalities([]); setCityQuery(''); setSelectedCity(''); setShowCityOptions(false); setNeighborhoodInput(''); setShowEventMapPicker(false); setSelectedEventCoords(null); setEventMapRegion(null); setEventMapSearchText(''); setSearchingEventMapAddress(false); setLocatingEventMapUser(false); setEventDateInput(''); setEventTimeInput(''); setPriceIsFree(false); setShowMyAds(false); setTab('Anunciar');
    const locationNote = !geocoded
      ? `\n\nAtenção: não conseguimos localizar a cidade ou o endereço automaticamente. O anúncio foi salvo, mas não terá marcador até corrigir a localização.`
      : geocoded.usedCityFallback
        ? `\n\nAtenção: não foi possível confirmar o endereço exato. O marcador foi colocado aproximadamente no centro de ${city}, ${stateCode}. Corrija o endereço em “Ver meus anúncios” para posicioná-lo com mais precisão.`
        : `\n\nLocalização encontrada dentro da região de ${city}, ${stateCode}. Se o marcador não estiver no ponto correto, use “Ajustar localização do mapa” em “Ver meus anúncios”.`;
    Alert.alert('Anúncio criado', `${cloudMessage}${locationNote}`, [{ text: 'Ver meus anúncios', onPress: () => setShowMyAds(true) }, { text: 'Continuar', onPress: () => setTab('Explorar') }]);
  };
  const field = (key, placeholder, multiline = false) => <TextInput value={form[key]} onChangeText={v => setForm({ ...form, [key]: v })} placeholder={placeholder} placeholderTextColor="#9696A5" multiline={multiline} style={[styles.input, multiline && styles.multiline]} />;
  const rangePills = [5, 10, 25, 50];
  return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" backgroundColor="#F7F7FB" />
    {(tab !== 'Explorar' || selected) && <View style={styles.topBar}><View><Text style={styles.brand}>Project<Text style={styles.brandDot}>.</Text></Text><TouchableOpacity onPress={locate} style={styles.location}><Text style={styles.locationPin}>⌖</Text><Text style={styles.locationText}>{locationLabel}</Text><Text style={styles.chevron}>⌄</Text></TouchableOpacity><Text style={styles.syncLabel}>{syncStatus}</Text></View><TouchableOpacity style={styles.avatar} onPress={() => Alert.alert('Conexão', HAS_SUPABASE ? `Configuração Supabase detectada. Status: ${syncStatus}` : 'O aplicativo está em modo local. Para ativar a sincronização entre usuários, configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY conforme o README.')}><Text style={styles.avatarText}>✦</Text></TouchableOpacity></View>}
    {tab === 'Explorar' && !selected && <View style={styles.mapScreen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: userCoords?.latitude ?? -15.7939, longitude: userCoords?.longitude ?? -47.8828, latitudeDelta: 0.09, longitudeDelta: 0.09 }}
        region={undefined}
        showsUserLocation={!!userCoords}
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
        onMapReady={() => {
          if (userCoords) mapRef.current?.animateToRegion({ latitude: userCoords.latitude, longitude: userCoords.longitude, ...mapDeltasForRadius(radius, userCoords.latitude) }, 250);
        }}
      >
        {filtered.filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number').map(e => (
          <Marker key={String(e.id)} coordinate={{ latitude: e.latitude, longitude: e.longitude }} onPress={() => setSelected(e)} tracksViewChanges={false}>
            <View style={styles.mapMarker}><Text style={styles.mapMarkerEmoji}>{e.emoji || '✨'}</Text></View>
          </Marker>
        ))}
      </MapView>
      <View pointerEvents="box-none" style={styles.mapOverlay}>
        <View style={styles.mapTopCard}>
          <View style={styles.mapBrandRow}>
            <View style={{flex:1}}>
              <Text style={styles.brand}>Project<Text style={styles.brandDot}>.</Text></Text>
              <TouchableOpacity onPress={locate} style={styles.location}>
                <Text style={styles.locationPin}>⌖</Text>
                <Text style={styles.locationText}>{locationLabel}</Text>
                <Text style={styles.chevron}>⌄</Text>
                {loadingLocation ? <ActivityIndicator size="small" color="#45454F" style={{marginLeft:8}} /> : null}
              </TouchableOpacity>
              <Text style={styles.syncLabel}>{syncStatus}</Text>
              {HAS_SUPABASE && <TouchableOpacity style={styles.refreshEventsButton} onPress={syncFromCloud} disabled={refreshingEvents} accessibilityRole="button" accessibilityLabel="Atualizar anúncios da nuvem">{refreshingEvents ? <ActivityIndicator size="small" color="#45454F"/> : <Text style={styles.refreshEventsText}>↻ Atualizar anúncios</Text>}</TouchableOpacity>}
            </View>
            <TouchableOpacity style={styles.avatar} onPress={locate}><Text style={styles.avatarText}>⌖</Text></TouchableOpacity>
          </View>
          <View style={styles.mapSearchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput value={query} onChangeText={setQuery} placeholder="Evento, lugar ou experiência..." placeholderTextColor="#9292A1" style={styles.searchInput}/>
            <TouchableOpacity onPress={locate} accessibilityLabel="Usar minha localização">{loadingLocation ? <ActivityIndicator color="#45454F"/> : <Text style={styles.filterIcon}>◎</Text>}</TouchableOpacity>
          </View>
          <View style={styles.mapRegionRow}>
            <TextInput value={manualRegion} onChangeText={setManualRegion} placeholder="Buscar bairro ou cidade" placeholderTextColor="#9292A1" style={styles.regionInput}/>
            <TouchableOpacity onPress={searchRegion} style={styles.regionButton}><Text style={styles.regionButtonText}>Buscar</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapPillsRow}>
            {CATEGORIES.map(c => <Pill key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
          </ScrollView>
        </View>
        <View style={styles.mapControls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusMapRow}>
            {[5,10,25,50].map(km => <Pill key={km} label={`${km} km`} active={radius === km} onPress={() => setRadius(km)} />)}
          </ScrollView>
        </View>
        <View pointerEvents="box-none" style={styles.mapRightRail}>
          <TouchableOpacity style={styles.mapSideButton} onPress={() => setShowEventPanel(v => !v)} accessibilityLabel={showEventPanel ? 'Fechar lista de eventos' : 'Mostrar eventos'}>
            <Text style={styles.mapSideIcon}>{showEventPanel ? '×' : '☷'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapSideButton} onPress={locate} accessibilityLabel="Centralizar minha localização">
            {loadingLocation ? <ActivityIndicator color="#45454F" /> : <Text style={styles.mapSideIcon}>⌖</Text>}
          </TouchableOpacity>
        </View>
        {showEventPanel && <View style={styles.mapPreviewPanel}>
          <View style={styles.mapPreviewHeader}><View style={{flex:1}}><Text style={styles.mapPreviewHeading}>Perto de você</Text><Text style={styles.mapPreviewSubheading}>{filtered.length} {filtered.length === 1 ? 'evento encontrado' : 'eventos encontrados'}{filtered.some(e => !Number.isFinite(e.latitude) || !Number.isFinite(e.longitude)) ? ' · alguns sem marcador' : ''}</Text></View><TouchableOpacity onPress={() => setShowEventPanel(false)} style={styles.mapPreviewClose}><Text style={styles.mapPreviewCloseText}>×</Text></TouchableOpacity></View>
          <ScrollView style={styles.mapPreviewList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {filtered.length ? filtered.slice(0, 4).map((e) => (
              <View key={String(e.id)} style={styles.mapPreviewRow}>
                <TouchableOpacity style={[styles.mapPreviewEmojiBox, { backgroundColor: e.color || '#E5E5EA' }]} onPress={() => { setSelected(e); setShowEventPanel(false); }} accessibilityLabel={`Abrir ${e.title}`}><Text style={styles.mapPreviewEmoji}>{e.emoji || '✨'}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mapPreviewCopy} onPress={() => { setSelected(e); setShowEventPanel(false); }} activeOpacity={0.85}>
                  <Text numberOfLines={1} style={styles.mapPreviewCategory}>{(e.category || 'EVENTO').toUpperCase()}</Text>
                  <Text numberOfLines={1} style={styles.mapPreviewTitle}>{e.title}</Text>
                  <Text numberOfLines={1} style={styles.mapPreviewMeta}>{e.venue}{e.neighborhood ? ` · ${e.neighborhood}` : ''}</Text>
                  <Text numberOfLines={1} style={styles.mapPreviewDistance}>{e.distanceKm == null ? e.price : `${e.distanceKm.toFixed(1).replace('.', ',')} km · ${e.price}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapPreviewHeart} onPress={() => toggleSaved(e.id)} accessibilityLabel={savedIds.includes(String(e.id)) ? 'Remover dos salvos' : 'Salvar evento'}><Text style={[styles.mapPreviewHeartText, savedIds.includes(String(e.id)) && styles.cardHeartActive]}>{savedIds.includes(String(e.id)) ? '♥' : '♡'}</Text></TouchableOpacity>
              </View>
            )) : <Text style={styles.mapPreviewEmpty}>Nenhum evento neste filtro. Aumente o raio ou pesquise outra região.</Text>}
          </ScrollView>
        </View>}
      </View>
    </View>}
    {tab === 'Explorar' && selected && <ScrollView contentContainerStyle={styles.content}><TouchableOpacity style={styles.backButton} onPress={() => setSelected(null)}><Text style={styles.backText}>‹  Voltar aos eventos</Text></TouchableOpacity><View style={[styles.detailArt, { backgroundColor: selected.color || '#D9D9E0' }]}><Text style={{ fontSize: 78 }}>{selected.emoji || '✨'}</Text></View><Text style={styles.eventCategory}>{(selected.category || 'Eventos').toUpperCase()}</Text><Text style={styles.detailTitle}>{selected.title}</Text><Text style={styles.detailMeta}>📍 {selected.venue} · {selected.neighborhood}</Text><Text style={styles.detailMeta}>◷ {selected.date}</Text><Text style={styles.detailPrice}>{selected.price}</Text>{selected.distanceKm != null && <Text style={styles.detailMeta}>A {selected.distanceKm.toFixed(1).replace('.', ',')} km da região escolhida</Text>}<Text style={styles.detailSection}>Sobre o evento</Text><Text style={styles.detailDescription}>{selected.description}</Text><TouchableOpacity style={styles.secondaryButton} onPress={() => toggleSaved(selected.id)}><Text style={styles.secondaryButtonText}>{savedIds.includes(String(selected.id)) ? '♥  Remover dos salvos' : '♡  Salvar este evento'}</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={() => openMap(selected)}><Text style={styles.primaryButtonText}>Ver rota no Google Maps ↗</Text></TouchableOpacity><Text style={styles.disclaimer}>Eventos de demonstração e locais geocodificados podem ter coordenadas aproximadas. Confirme endereço, valor e horário com o organizador.</Text></ScrollView>}
    {tab === 'Anunciar' && <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>PARA ORGANIZADORES</Text>
      <Text style={styles.headline}>{showMyAds ? 'Seus anúncios' : <>Coloque seu evento{ '\n' }<Text style={styles.headlineAccent}>no mapa.</Text></>}</Text>
      <TouchableOpacity style={styles.myAdsToggle} onPress={() => setShowMyAds(v => !v)} activeOpacity={0.85}>
        <View style={styles.myAdsToggleIcon}><Text style={styles.myAdsToggleIconText}>{showMyAds ? '＋' : '▤'}</Text></View>
        <View style={{flex:1}}><Text style={styles.myAdsToggleTitle}>{showMyAds ? 'Criar novo anúncio' : 'Ver meus anúncios'}</Text><Text style={styles.myAdsToggleSubtitle}>{showMyAds ? 'Voltar ao formulário de publicação' : `${myAds.length} ${myAds.length === 1 ? 'anúncio cadastrado' : 'anúncios cadastrados'} neste aparelho`}</Text></View>
        <Text style={styles.myAdsToggleChevron}>{showMyAds ? '＋' : '›'}</Text>
      </TouchableOpacity>
      {showMyAds ? <View style={styles.myAdsList}>
        {myAds.length ? myAds.map(e => <View key={String(e.id)} style={styles.myAdCard}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10,width:'100%'}}><View style={[styles.myAdEmojiBox,{backgroundColor:e.color || '#E5E5EA'}]}><Text style={styles.myAdEmoji}>{e.emoji || '✨'}</Text></View>
          <View style={styles.myAdInfo}><Text style={styles.myAdCategory}>{(e.category || 'EVENTO').toUpperCase()}</Text><Text style={styles.myAdTitle}>{e.title}</Text><Text style={styles.myAdMeta}>{e.venue} · {e.neighborhood}</Text><Text style={styles.myAdStatus}>{Number.isFinite(e.latitude) && Number.isFinite(e.longitude) ? '● Localização definida' : '● Sem coordenadas para o mapa'}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Excluir anúncio?', `Deseja excluir “${e.title}” deste aparelho?`, [{text:'Cancelar',style:'cancel'},{text:'Excluir',style:'destructive',onPress:()=>deleteMyAd(e.id)}])} style={styles.myAdDelete}><Text style={styles.myAdDeleteText}>Excluir</Text></TouchableOpacity></View>
          <View style={{width:'100%',marginTop:8}}>
            {locationFixFor === String(e.id) ? <><TextInput value={locationFixText} onChangeText={setLocationFixText} placeholder="Endereço, bairro, cidade - UF" placeholderTextColor="#9696A5" style={styles.input}/><TouchableOpacity style={styles.primaryButton} disabled={savingLocationFix} onPress={() => repairAdLocation(e)}><Text style={styles.primaryButtonText}>{savingLocationFix ? 'Localizando…' : 'Corrigir localização'}</Text></TouchableOpacity><TouchableOpacity onPress={() => {setLocationFixFor(null);setLocationFixText('');}}><Text style={styles.helperText}>Cancelar</Text></TouchableOpacity></> : <TouchableOpacity style={styles.secondaryButton} onPress={() => {setLocationFixFor(String(e.id));setLocationFixText(e.address && !/Brasília,? DF/i.test(e.address) ? e.address : '');}}><Text style={styles.secondaryButtonText}>{Number.isFinite(e.latitude) && Number.isFinite(e.longitude) ? 'Ajustar localização do mapa' : 'Adicionar localização para o mapa'}</Text></TouchableOpacity>}
          </View>
        </View>) : <View style={styles.empty}><Text style={styles.emptyEmoji}>＋</Text><Text style={styles.emptyTitle}>Você ainda não criou anúncios</Text><Text style={styles.emptyText}>Quando publicar um evento, ele aparecerá aqui para você consultar.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setShowMyAds(false)}><Text style={styles.primaryButtonText}>Criar meu primeiro anúncio</Text></TouchableOpacity></View>}
      </View> : <><Text style={styles.formIntro}>Informe o endereço real do evento. O ProjectX tentará obter as coordenadas para criar o marcador no mapa. Com o Supabase configurado, o anúncio também poderá ser compartilhado.</Text>
      <Text style={styles.label}>Nome do evento *</Text>{field('title', 'Ex.: Festival de música')}<Text style={styles.label}>Categoria</Text><View style={styles.categoryWrap}>{CATEGORIES.filter(c => c !== 'Tudo').map(c => <Pill key={c} label={c} active={form.category === c} onPress={() => setForm({ ...form, category: c })} />)}</View><Text style={styles.label}>Local / estabelecimento *</Text>{field('venue', 'Ex.: Parque, restaurante, casa de shows')}<Text style={styles.label}>Estado onde o evento acontecerá *</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Selecionar estado" style={[styles.input, styles.stateSelector]} onPress={() => setShowUFOptions(v => !v)}><Text style={[styles.stateSelectorText, !selectedUF && styles.statePlaceholder]}>{selectedUF ? `${selectedUF.name} (${selectedUF.code})` : 'Selecione o estado primeiro'}</Text><Text style={styles.stateSelectorChevron}>{showUFOptions ? '⌃' : '⌄'}</Text></TouchableOpacity>{showUFOptions && <View style={styles.stateOptions}><ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.stateOptionsScroll}>{BRAZIL_STATES.map(state => <TouchableOpacity key={state.code} style={[styles.stateOption, selectedUF?.code === state.code && styles.stateOptionActive]} onPress={() => { setSelectedUF(state); setShowUFOptions(false); }}><Text style={[styles.stateOptionText, selectedUF?.code === state.code && styles.stateOptionTextActive]}>{state.name} ({state.code})</Text></TouchableOpacity>)}</ScrollView></View>}<Text style={styles.label}>Cidade *</Text><TextInput value={cityQuery} onFocus={() => { if (selectedUF) setShowCityOptions(true); }} onChangeText={value => { setCityQuery(value); setSelectedCity(''); setShowCityOptions(true); }} editable={!!selectedUF && !loadingMunicipalities} placeholder={!selectedUF ? 'Selecione o estado primeiro' : loadingMunicipalities ? 'Carregando cidades do estado…' : 'Digite para buscar uma cidade'} placeholderTextColor="#9696A5" style={styles.input} accessibilityLabel="Pesquisar cidade"/><Text style={styles.helperText}>{loadingMunicipalities ? 'Carregando a lista oficial de municípios do IBGE…' : selectedCity ? `Cidade selecionada: ${selectedCity} - ${selectedUF?.code}` : municipalities.length ? 'Escolha uma cidade na lista para continuar.' : 'Se a lista não carregar, verifique a conexão e tente novamente.'}</Text>{showCityOptions && !!selectedUF && !loadingMunicipalities && <View style={styles.stateOptions}><ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.stateOptionsScroll}>{cityQuery.trim().length < 2 ? <Text style={styles.helperText}>Digite pelo menos 2 letras para pesquisar entre todos os municípios de {selectedUF.name}.</Text> : municipalities.filter(name => name.toLocaleLowerCase('pt-BR').includes(cityQuery.trim().toLocaleLowerCase('pt-BR'))).slice(0, 40).map(name => <TouchableOpacity key={name} style={[styles.stateOption, selectedCity === name && styles.stateOptionActive]} onPress={() => { setSelectedCity(name); setCityQuery(name); setShowCityOptions(false); }}><Text style={[styles.stateOptionText, selectedCity === name && styles.stateOptionTextActive]}>{name} - {selectedUF.code}</Text></TouchableOpacity>)}{cityQuery.trim().length >= 2 && municipalities.filter(name => name.toLocaleLowerCase('pt-BR').includes(cityQuery.trim().toLocaleLowerCase('pt-BR'))).length === 0 && <Text style={styles.helperText}>Nenhuma cidade encontrada com esse nome. Confira a grafia.</Text>}</ScrollView></View>}<Text style={styles.label}>Bairro (opcional)</Text><TextInput value={neighborhoodInput} onChangeText={setNeighborhoodInput} placeholder="Ex.: Centro, Chatuba, Asa Sul" placeholderTextColor="#9696A5" style={styles.input} editable={!!selectedCity} accessibilityLabel="Bairro do evento"/><Text style={styles.label}>Rua e número / endereço completo</Text>{field('address', 'Ex.: Rua das Flores, 123')}<Text style={styles.helperText}>A cidade é selecionada em uma lista oficial de municípios do IBGE filtrada pelo estado. Depois, informe o bairro e o endereço para refinar a localização do marcador.</Text><TouchableOpacity accessibilityRole="button" style={styles.mapPickerToggle} disabled={!selectedCity} onPress={() => setShowEventMapPicker(v => !v)}><Text style={styles.mapPickerToggleText}>{showEventMapPicker ? 'Fechar mapa de localização' : selectedEventCoords ? 'Alterar ponto no mapa' : 'Marcar localização exata no mapa'}</Text></TouchableOpacity>{showEventMapPicker && !!selectedCity && <View style={styles.eventMapPickerWrap}><Text style={styles.helperText}>Toque no mapa no ponto exato do evento. Arraste o mapa para encontrar o local; o marcador será colocado onde você tocar.</Text><View style={styles.eventMapSearchRow}><TextInput value={eventMapSearchText} onChangeText={setEventMapSearchText} placeholder="Buscar rua, endereço ou local" placeholderTextColor="#9696A5" style={[styles.input, styles.eventMapSearchInput]} returnKeyType="search" onSubmitEditing={searchEventMapAddress} accessibilityLabel="Buscar endereço no mapa"/><TouchableOpacity style={styles.eventMapSearchButton} onPress={searchEventMapAddress} disabled={searchingEventMapAddress}>{searchingEventMapAddress ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.eventMapSearchButtonText}>Buscar</Text>}</TouchableOpacity></View><TouchableOpacity style={styles.eventMapGpsButton} onPress={centerEventMapOnCurrentLocation} disabled={locatingEventMapUser}>{locatingEventMapUser ? <ActivityIndicator color="#45454F"/> : <Text style={styles.eventMapGpsText}>◎  Minha localização</Text>}</TouchableOpacity><MapView ref={eventMapRef} key={`${selectedCity}-${selectedUF?.code}-${eventMapRegion?.latitude ?? "loading"}-${eventMapRegion?.longitude ?? "loading"}`} style={styles.eventMapPicker} initialRegion={eventMapRegion || { latitude: userCoords?.latitude ?? -15.7939, longitude: userCoords?.longitude ?? -47.8828, latitudeDelta: 0.06, longitudeDelta: 0.06 }} onMapReady={() => { if (eventMapRegion) eventMapRef.current?.animateToRegion(eventMapRegion, 250); }} onPress={e => { const point = e.nativeEvent.coordinate; setSelectedEventCoords({ latitude: point.latitude, longitude: point.longitude }); }}><>{selectedEventCoords && <Marker draggable coordinate={{ latitude: selectedEventCoords.latitude, longitude: selectedEventCoords.longitude }} title="Local do evento" description="Arraste para ajustar o ponto" onDragEnd={e => { const point = e.nativeEvent.coordinate; setSelectedEventCoords({ latitude: point.latitude, longitude: point.longitude }); }} />}</></MapView><Text style={styles.helperText}>{selectedEventCoords ? `Ponto selecionado: ${selectedEventCoords.latitude.toFixed(5)}, ${selectedEventCoords.longitude.toFixed(5)}` : 'Nenhum ponto selecionado. Toque no mapa para marcar o local.'}</Text>{selectedEventCoords && <TouchableOpacity style={styles.clearMapPointButton} onPress={() => setSelectedEventCoords(null)}><Text style={styles.clearMapPointText}>Remover ponto selecionado</Text></TouchableOpacity>}</View>}
      <Text style={styles.label}>Data do evento *</Text><View style={styles.quickDateRow}><TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); setEventDateInput(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`); }}><Text style={styles.quickDateText}>Hoje</Text></TouchableOpacity><TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); d.setDate(d.getDate()+1); setEventDateInput(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`); }}><Text style={styles.quickDateText}>Amanhã</Text></TouchableOpacity></View>
      <View style={styles.dateTimeRow}><View style={styles.dateFieldWrap}><Text style={styles.fieldHint}>Dia / mês / ano</Text><TextInput value={eventDateInput} onChangeText={v => setEventDateInput(maskDateInput(v))} placeholder="DD/MM/AAAA" placeholderTextColor="#9696A5" keyboardType="number-pad" maxLength={10} style={styles.input}/></View><View style={styles.timeFieldWrap}><Text style={styles.fieldHint}>Horário</Text><TextInput value={eventTimeInput} onChangeText={v => setEventTimeInput(maskTimeInput(v))} placeholder="HH:MM" placeholderTextColor="#9696A5" keyboardType="number-pad" maxLength={5} style={styles.input}/></View></View><Text style={styles.helperText}>Exemplo: 25/10/2026 às 19:30. Use o formato de 24 horas.</Text>
      <Text style={styles.label}>Preço / entrada</Text><TouchableOpacity style={[styles.freePriceButton, priceIsFree && styles.freePriceButtonActive]} onPress={() => { setPriceIsFree(!priceIsFree); if (!priceIsFree) setForm({ ...form, price: '' }); }}><Text style={[styles.freePriceText, priceIsFree && styles.freePriceTextActive]}>{priceIsFree ? '✓ Entrada gratuita' : 'Marcar como gratuito'}</Text></TouchableOpacity>{!priceIsFree && <View style={styles.currencyInputWrap}><Text style={styles.currencyPrefix}>R$</Text><TextInput value={form.price} onChangeText={v => setForm({ ...form, price: currencyInput(v) })} placeholder="0,00" placeholderTextColor="#9696A5" keyboardType="decimal-pad" style={[styles.input, styles.currencyInput]} accessibilityLabel="Valor em reais"/><Text style={styles.currencyHint}>Valor em reais (BRL)</Text></View>}<Text style={styles.helperText}>Se houver cobrança, informe o valor em reais. Se não souber, deixe em branco.</Text>
      <Text style={styles.label}>Descrição</Text>{field('description', 'Conte o que as pessoas vão encontrar...', true)}<TouchableOpacity style={styles.primaryButton} onPress={publish}><Text style={styles.primaryButtonText}>Criar anúncio ↗</Text></TouchableOpacity><Text style={styles.disclaimer}>Sem Supabase configurado, o anúncio fica apenas neste aparelho. A opção “Ver meus anúncios” permite consultá-lo.</Text></>}
    </ScrollView>}
    {tab === 'Salvos' && <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.eyebrow}>SUA LISTA PESSOAL</Text><Text style={styles.headline}>Seus eventos{ '\n' }<Text style={styles.headlineAccent}>favoritos.</Text></Text><Text style={styles.formIntro}>Favoritos persistidos neste aparelho.</Text>{savedEvents.length ? savedEvents.map(e => <EventCard key={e.id} event={e} hasUserLocation={!!userCoords} isSaved onToggleSave={() => toggleSaved(e.id)} onPress={() => { setSelected(e); setTab('Explorar'); }} />) : <View style={styles.empty}><Text style={styles.emptyEmoji}>♡</Text><Text style={styles.emptyTitle}>Nenhum evento salvo ainda</Text><Text style={styles.emptyText}>Toque no coração de um evento para encontrá-lo aqui.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => setTab('Explorar')}><Text style={styles.primaryButtonText}>Explorar eventos</Text></TouchableOpacity></View>}</ScrollView>}
    <View style={styles.tabBar}>{[['Explorar','⌕'],['Salvos','♡'],['Anunciar','＋']].map(([name, icon]) => <TouchableOpacity key={name} style={styles.tabItem} onPress={() => { setSelected(null); setTab(name); setShowEventPanel(false); if (name !== 'Anunciar') setShowMyAds(false); }}><Text style={[styles.tabIcon, tab === name && styles.tabIconActive]}>{icon}</Text><Text style={[styles.tabLabel, tab === name && styles.tabLabelActive]}>{name}</Text>{tab === name && <View style={styles.tabUnderline} />}</TouchableOpacity>)}</View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
 eventMapSearchRow:{flexDirection:'row',alignItems:'center',gap:8}, eventMapSearchInput:{flex:1,marginBottom:0}, eventMapSearchButton:{backgroundColor:'#45454F',borderRadius:12,minWidth:78,paddingHorizontal:12,paddingVertical:13,alignItems:'center',justifyContent:'center'}, eventMapSearchButtonText:{color:'#FFFFFF',fontWeight:'700',fontSize:13}, eventMapGpsButton:{alignSelf:'flex-start',borderRadius:12,borderWidth:1,borderColor:'#DAD9E4',backgroundColor:'#FFFFFF',paddingHorizontal:13,paddingVertical:10,marginTop:8,marginBottom:8}, eventMapGpsText:{color:'#45454F',fontWeight:'700',fontSize:13},
 mapPickerToggle:{borderRadius:13,backgroundColor:'#45454F',paddingVertical:14,paddingHorizontal:16,alignItems:'center',justifyContent:'center',marginTop:8,marginBottom:10},
 mapPickerToggleText:{color:'#FFFFFF',fontSize:14,fontWeight:'700'}, eventMapPickerWrap:{marginBottom:12,gap:8}, eventMapPicker:{height:260,borderRadius:16,overflow:'hidden'}, clearMapPointButton:{paddingVertical:10,alignItems:'center'}, clearMapPointText:{color:'#8A3540',fontSize:13,fontWeight:'600'},
 stateSelector:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 stateSelectorText:{fontSize:14,color:'#222232',flex:1}, statePlaceholder:{color:'#9696A5'}, stateSelectorChevron:{fontSize:18,color:'#6B6B7B',marginLeft:10},
 stateOptions:{borderWidth:1,borderColor:'#ECEBF3',borderRadius:14,backgroundColor:'#FFFFFF',marginTop:-4,marginBottom:12,overflow:'hidden'},
 stateOptionsScroll:{maxHeight:190}, stateOption:{paddingHorizontal:14,paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#F0EFF5'},
 stateOptionActive:{backgroundColor:'#45454F'}, stateOptionText:{fontSize:14,color:'#343447'}, stateOptionTextActive:{color:'#FFFFFF',fontWeight:'700'},
 refreshEventsButton:{alignSelf:'flex-start',marginTop:4,paddingVertical:4,paddingHorizontal:2,minHeight:24,justifyContent:'center'}, refreshEventsText:{fontSize:12,color:'#45454F',fontWeight:'700'},
 mapScreen:{flex:1,backgroundColor:'#EDECF4'},
  mapOverlay:{...StyleSheet.absoluteFillObject,justifyContent:'flex-start',paddingTop:6,paddingBottom:0},
 mapTopCard:{marginHorizontal:14,backgroundColor:'rgba(247,247,251,0.96)',borderRadius:23,paddingHorizontal:14,paddingTop:8,paddingBottom:10,shadowColor:'#171725',shadowOpacity:0.10,shadowRadius:14,shadowOffset:{width:0,height:4},elevation:4},
 mapBrandRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:9},
 mapSearchBox:{height:46,backgroundColor:'#FFFFFF',borderRadius:15,borderWidth:1,borderColor:'#ECEBF3',flexDirection:'row',alignItems:'center',paddingHorizontal:12,marginBottom:7},
 mapRegionRow:{height:38,backgroundColor:'#FFFFFF',borderRadius:12,borderWidth:1,borderColor:'#ECEBF3',flexDirection:'row',alignItems:'center',paddingLeft:10,paddingRight:4,marginBottom:8},
 mapPillsRow:{gap:7,paddingBottom:1},
 mapControls:{flexDirection:'row',alignItems:'center',gap:8,marginLeft:14,marginRight:76,marginTop:7},
 radiusMapRow:{gap:7,paddingRight:4},
 mapRightRail:{position:'absolute',right:12,top:275,alignItems:'center',gap:10},
 mapLeftRail:{position:'absolute',left:10,top:275,alignItems:'center',gap:8,maxHeight:330},
 mapEventIconButton:{width:46,height:46,borderRadius:15,borderWidth:2,borderColor:'#45454F',alignItems:'center',justifyContent:'center',shadowColor:'#171725',shadowOpacity:0.16,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:5},
 mapEventIconEmoji:{fontSize:22}, mapSavedDot:{position:'absolute',top:2,right:2,width:8,height:8,borderRadius:4,backgroundColor:'#23B889',borderWidth:1,borderColor:'#FFFFFF'},
 mapNoEvents:{width:42,height:42,borderRadius:14,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'}, mapNoEventsText:{color:'#888898'},
 mapSideButton:{width:46,height:46,borderRadius:16,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#ECEBF3',alignItems:'center',justifyContent:'center',shadowColor:'#171725',shadowOpacity:0.16,shadowRadius:7,shadowOffset:{width:0,height:2},elevation:5},
 mapSideIcon:{fontSize:25,fontWeight:'700',color:'#45454F'},
  mapBottomSheet:{position:'absolute',left:10,right:10,bottom:10,maxHeight:154,backgroundColor:'rgba(247,247,251,0.98)',borderRadius:22,paddingTop:10,paddingHorizontal:12,paddingBottom:10,shadowColor:'#171725',shadowOpacity:0.16,shadowRadius:15,shadowOffset:{width:0,height:-3},elevation:9},
  sheetHeaderRow:{flexDirection:'row',alignItems:'center',marginBottom:9},
  closePanelButton:{width:32,height:32,borderRadius:11,backgroundColor:'#E5E5EA',alignItems:'center',justifyContent:'center',marginLeft:8},
  closePanelText:{fontSize:23,color:'#45454F',lineHeight:26},
 mapEventRow:{gap:10,paddingBottom:2},
  mapEventCard:{width:278,height:92,backgroundColor:'#FFFFFF',borderRadius:17,borderWidth:1,borderColor:'#ECEBF3',padding:8,flexDirection:'row',alignItems:'center',gap:9},
  mapEventArt:{width:54,height:68,borderRadius:12,alignItems:'center',justifyContent:'center'},
 mapEventTitle:{fontSize:13,fontWeight:'900',color:'#202031',marginBottom:3},
 mapEventMeta:{fontSize:10,color:'#818192',marginBottom:5},
 mapHeart:{alignSelf:'flex-start',padding:2},
 mapEmpty:{padding:15,justifyContent:'center'},
 mapPreviewPanel:{position:'absolute',left:10,top:270,width:236,maxHeight:300,backgroundColor:'rgba(255,255,255,0.98)',borderRadius:18,padding:10,borderWidth:1,borderColor:'#ECEBF3',shadowColor:'#171725',shadowOpacity:0.18,shadowRadius:12,shadowOffset:{width:0,height:3},elevation:8},
 mapPreviewHeader:{flexDirection:'row',alignItems:'center',marginBottom:7,paddingHorizontal:2},mapPreviewHeading:{fontSize:14,fontWeight:'900',color:'#202031'},mapPreviewSubheading:{fontSize:10,color:'#818192',marginTop:2},mapPreviewClose:{width:27,height:27,borderRadius:9,backgroundColor:'#F0F0F3',alignItems:'center',justifyContent:'center',marginLeft:6},mapPreviewCloseText:{fontSize:20,color:'#45454F',lineHeight:23},mapPreviewList:{flexGrow:0},
 mapPreviewRow:{flexDirection:'row',alignItems:'center',paddingVertical:7,borderTopWidth:1,borderTopColor:'#F0EFF5',gap:7},mapPreviewEmojiBox:{width:42,height:46,borderRadius:11,alignItems:'center',justifyContent:'center'},mapPreviewEmoji:{fontSize:22},mapPreviewCopy:{flex:1,minWidth:0},mapPreviewCategory:{fontSize:8,fontWeight:'900',letterSpacing:1,color:'#45454F',marginBottom:2},mapPreviewTitle:{fontSize:11,fontWeight:'900',color:'#202031',marginBottom:2},mapPreviewMeta:{fontSize:9,color:'#818192',marginBottom:2},mapPreviewDistance:{fontSize:9,fontWeight:'800',color:'#278466'},mapPreviewHeart:{paddingHorizontal:2,paddingVertical:5},mapPreviewHeartText:{fontSize:19,color:'#9B9BA9'},mapPreviewEmpty:{fontSize:11,lineHeight:16,color:'#818192',padding:8},
 myAdsToggle:{flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E9E6F4',borderRadius:17,padding:12,marginBottom:18,shadowColor:'#171725',shadowOpacity:0.04,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:1},myAdsToggleIcon:{width:42,height:42,borderRadius:13,backgroundColor:'#E5E5EA',alignItems:'center',justifyContent:'center'},myAdsToggleIconText:{fontSize:22,color:'#45454F',fontWeight:'800'},myAdsToggleTitle:{fontSize:13,fontWeight:'900',color:'#202031'},myAdsToggleSubtitle:{fontSize:10,color:'#818192',marginTop:3},myAdsToggleChevron:{fontSize:24,color:'#45454F',paddingHorizontal:4},
 myAdsList:{gap:10},myAdCard:{flexDirection:'column',alignItems:'stretch',gap:10,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#ECEBF3',borderRadius:17,padding:10,marginBottom:10},myAdEmojiBox:{width:54,height:60,borderRadius:13,alignItems:'center',justifyContent:'center'},myAdEmoji:{fontSize:26},myAdInfo:{flex:1,minWidth:0},myAdCategory:{fontSize:8,fontWeight:'900',letterSpacing:1,color:'#45454F',marginBottom:3},myAdTitle:{fontSize:13,fontWeight:'900',color:'#202031',marginBottom:3},myAdMeta:{fontSize:10,color:'#818192',marginBottom:4},myAdStatus:{fontSize:9,color:'#278466',fontWeight:'800'},myAdDelete:{paddingVertical:7,paddingHorizontal:8,borderRadius:9,backgroundColor:'#FFF0F2'},myAdDeleteText:{fontSize:10,color:'#C53D62',fontWeight:'900'},
 mapMarker:{width:43,height:43,borderRadius:16,backgroundColor:'#FFFFFF',borderColor:'#45454F',borderWidth:2,alignItems:'center',justifyContent:'center',shadowColor:'#171725',shadowOpacity:0.2,shadowRadius:5,elevation:4},
 mapMarkerEmoji:{fontSize:21},
 tabBar:{height:68,flexDirection:'row',alignItems:'stretch',justifyContent:'space-around',backgroundColor:'#FFFFFF',borderTopWidth:1,borderTopColor:'#ECEBF3',paddingHorizontal:8,paddingTop:5,paddingBottom:3},
 tabItem:{flex:1,flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',gap:2},
 tabIcon:{fontSize:24,color:'#9B9BA9',lineHeight:27},
 tabIconActive:{color:'#45454F'},
 tabLabel:{fontSize:10,fontWeight:'700',color:'#9696A5'},
 tabLabelActive:{color:'#45454F'},
 tabUnderline:{position:'absolute',bottom:0,width:24,height:3,borderRadius:2,backgroundColor:'#45454F'},
 eventCard:{backgroundColor:'#FFFFFF',borderRadius:20,borderWidth:1,borderColor:'#ECEBF3',padding:12,marginBottom:12,shadowColor:'#171725',shadowOpacity:0.04,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:1},
 eventCardMain:{flexDirection:'row',alignItems:'center',gap:12},
 eventArt:{width:82,height:96,borderRadius:16,alignItems:'center',justifyContent:'center',flexShrink:0},
 eventEmoji:{fontSize:31},
 distanceBadge:{position:'absolute',left:5,right:5,bottom:5,backgroundColor:'rgba(255,255,255,0.9)',borderRadius:8,paddingVertical:4,alignItems:'center'},
 distanceText:{fontSize:9,fontWeight:'800',color:'#454556'},
 eventInfo:{flex:1,minWidth:0},
 eventTopLine:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:4},
 eventCategory:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:'#45454F'},
 cardHeart:{paddingHorizontal:4,paddingVertical:1},
 cardHeartText:{fontSize:22,color:'#9B9BA9'},
 cardHeartActive:{color:'#E84D83'},
 eventTitle:{fontSize:16,fontWeight:'900',color:'#202031',marginBottom:4},
 eventMeta:{fontSize:11,color:'#818192',marginBottom:7},
 eventBottom:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:4},
 eventDate:{fontSize:10,color:'#656575',fontWeight:'600'},
 eventPrice:{fontSize:11,color:'#278466',fontWeight:'900'},
quickDateRow:{flexDirection:'row',gap:8,marginBottom:8},
 quickDateButton:{paddingHorizontal:15,paddingVertical:9,borderRadius:12,backgroundColor:'#F0F0F3',borderWidth:1,borderColor:'#DDD7FF'},
 quickDateText:{fontSize:12,fontWeight:'800',color:'#45454F'},
 dateTimeRow:{flexDirection:'row',gap:10,alignItems:'flex-start'},
 dateFieldWrap:{flex:1.25}, timeFieldWrap:{flex:0.75},
 fieldHint:{fontSize:10,fontWeight:'700',color:'#858597',marginBottom:5,marginLeft:2},
 helperText:{fontSize:11,lineHeight:16,color:'#858597',marginTop:3,marginBottom:4},
 freePriceButton:{alignSelf:'flex-start',paddingHorizontal:13,paddingVertical:9,borderRadius:12,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DAD8E7',marginBottom:10},
 freePriceButtonActive:{backgroundColor:'#E5F8EF',borderColor:'#A9E7C9'},
 freePriceText:{fontSize:12,fontWeight:'800',color:'#45454F'},
 freePriceTextActive:{color:'#21845F'},
 currencyInputWrap:{position:'relative',flexDirection:'row',alignItems:'center'},
 currencyPrefix:{position:'absolute',left:14,zIndex:1,fontSize:14,fontWeight:'900',color:'#278466'},
 currencyInput:{paddingLeft:45,flex:1,marginBottom:3},
 currencyHint:{position:'absolute',right:12,fontSize:9,color:'#8A8999'},
 formIntro:{fontSize:13,lineHeight:19,color:'#686879',marginBottom:18},
 label:{fontSize:12,fontWeight:'800',color:'#343447',marginBottom:7,marginTop:12},
 input:{minHeight:48,backgroundColor:'#FFFFFF',borderRadius:14,borderWidth:1,borderColor:'#E5E3EF',paddingHorizontal:14,paddingVertical:12,fontSize:13,color:'#252536',marginBottom:3},
 multiline:{minHeight:104,textAlignVertical:'top'},
 categoryWrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
 primaryButton:{minHeight:50,backgroundColor:'#45454F',borderRadius:15,alignItems:'center',justifyContent:'center',paddingHorizontal:16,paddingVertical:13,marginTop:18,shadowColor:'#45454F',shadowOpacity:0.16,shadowRadius:7,elevation:2},
 primaryButtonText:{fontSize:14,fontWeight:'900',color:'#FFFFFF'},
 secondaryButton:{minHeight:46,backgroundColor:'#F0F0F3',borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:14,paddingVertical:12,marginTop:10},
 secondaryButtonText:{fontSize:13,fontWeight:'800',color:'#45454F'},
 disclaimer:{fontSize:10,lineHeight:15,color:'#8A8999',marginTop:12,marginBottom:18},
 empty:{backgroundColor:'#FFFFFF',borderRadius:20,borderWidth:1,borderColor:'#ECEBF3',padding:24,alignItems:'center',marginTop:12},
 emptyEmoji:{fontSize:34,color:'#45454F',marginBottom:10},
 emptyTitle:{fontSize:17,fontWeight:'900',color:'#252536',textAlign:'center',marginBottom:6},
 emptyText:{fontSize:12,lineHeight:18,color:'#818192',textAlign:'center',marginBottom:12},
 sectionTitle:{fontSize:18,fontWeight:'900',color:'#202031'},
 sectionSubtitle:{fontSize:11,color:'#818192'},
 backButton:{paddingVertical:8,paddingHorizontal:4,marginBottom:10},
 backText:{fontSize:13,fontWeight:'800',color:'#45454F'},
 detailArt:{height:170,borderRadius:22,alignItems:'center',justifyContent:'center',marginBottom:18},
 detailTitle:{fontSize:28,lineHeight:33,fontWeight:'900',color:'#202031',marginBottom:10},
 detailMeta:{fontSize:13,color:'#777789',marginBottom:8},
 detailPrice:{fontSize:16,fontWeight:'900',color:'#278466',marginBottom:16},
 detailSection:{fontSize:15,fontWeight:'900',color:'#252536',marginTop:14,marginBottom:6},
 detailDescription:{fontSize:14,lineHeight:21,color:'#656575',marginBottom:12},
 safe:{flex:1,backgroundColor:'#F7F7FB'},topBar:{paddingHorizontal:22,paddingTop:8,paddingBottom:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{fontSize:29,fontWeight:'900',letterSpacing:-1.4,color:'#171725'},brandDot:{color:'#45454F'},location:{flexDirection:'row',alignItems:'center',marginTop:2},locationPin:{fontSize:17,color:'#45454F',marginRight:5},locationText:{fontSize:12,color:'#656575',fontWeight:'600'},syncLabel:{fontSize:9,color:'#888898',marginTop:3},chevron:{color:'#77778A',marginLeft:4},avatar:{width:42,height:42,borderRadius:15,backgroundColor:'#E5E5EA',alignItems:'center',justifyContent:'center'},avatarText:{fontSize:22,color:'#45454F'},content:{paddingHorizontal:20,paddingTop:6,paddingBottom:34},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:2,color:'#45454F',marginTop:12,marginBottom:8},headline:{fontSize:34,lineHeight:39,fontWeight:'900',letterSpacing:-1.1,color:'#1C1C2A',marginBottom:20},headlineAccent:{color:'#45454F'},searchBox:{height:54,backgroundColor:'#FFFFFF',borderRadius:17,borderWidth:1,borderColor:'#ECEBF3',flexDirection:'row',alignItems:'center',paddingHorizontal:15,marginBottom:10},searchIcon:{fontSize:26,color:'#45454F',marginRight:9},searchInput:{flex:1,fontSize:13,color:'#222232'},filterIcon:{fontSize:24,color:'#45454F',paddingLeft:8},regionBox:{height:47,backgroundColor:'#FFFFFF',borderRadius:14,borderWidth:1,borderColor:'#ECEBF3',flexDirection:'row',alignItems:'center',paddingLeft:13,paddingRight:5,marginBottom:13},regionInput:{flex:1,fontSize:11,color:'#222232'},regionButton:{backgroundColor:'#E5E5EA',borderRadius:10,paddingHorizontal:12,paddingVertical:9},regionButtonText:{fontSize:11,color:'#45454F',fontWeight:'900'},rangeHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:7},rangeTitle:{fontSize:12,fontWeight:'900',color:'#343447'},rangeSubtitle:{fontSize:9,color:'#89899A',flexShrink:1,marginLeft:8},rangeRow:{gap:8,paddingBottom:13},categoryRow:{gap:8,paddingBottom:19},pill:{paddingHorizontal:15,paddingVertical:10,borderRadius:30,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E9E8F0'},pillActive:{backgroundColor:'#45454F',borderColor:'#45454F'},pillText:{fontSize:12,fontWeight:'700',color:'#6B6B7B'},pillTextActive:{color:'#FFFFFF'}, sectionHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
});

