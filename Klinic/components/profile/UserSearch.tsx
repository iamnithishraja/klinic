import React, { useState } from 'react';
import { View } from 'react-native';
import CitySearch from '../CitySearch';

const UserSearch = () => {
  const [city, setCity] = useState('');
  const [isCityChanged, setIsCityChanged] = useState(false);

  const onChangeCity = (newCity) => {
    setCity(newCity);
    setIsCityChanged(true);
  };

  return (
    <View className="flex-1">
      <CitySearch
        selectedCity={city}
        onCitySelect={onChangeCity}
        isCityChanged={isCityChanged}
      />
    </View>
  );
};

export default UserSearch; 