import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

type Coordinates = { latitude: number; longitude: number };

// Address text plus the coordinates behind it. Editing the text invalidates the
// coordinates; resolveCoords() re-geocodes on demand (call it on submit).
export default function useAddressPicker(initialAddress = '') {
  const [address, setAddressState] = useState(initialAddress);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);

  const setAddress = useCallback((text: string) => {
    setAddressState(text);
    setCoords(null);
  }, []);

  const fillFromCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location access needed', 'Allow location access, or type the address instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (!address.trim()) {
        const [place] = await Location.reverseGeocodeAsync(point);
        if (place) setAddressState([place.street, place.district, place.city].filter(Boolean).join(', '));
      }
      setCoords(point);
    } catch {
      Alert.alert("Couldn't get your location", 'Try again, or type the address instead.');
    } finally {
      setLocating(false);
    }
  }, [address]);

  const resolveCoords = useCallback(async () => {
    if (coords) return coords;
    try {
      const [hit] = await Location.geocodeAsync(address.trim());
      if (hit) {
        const point = { latitude: hit.latitude, longitude: hit.longitude };
        setCoords(point);
        return point;
      }
    } catch { /* fall through */ }
    return null;
  }, [coords, address]);

  return { address, setAddress, coords, locating, fillFromCurrentLocation, resolveCoords };
}