import React, { useEffect } from 'react';
import { Button, View, Text, FlatList, StyleSheet, TouchableOpacity, DeviceEventEmitter, Linking, Alert } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import queryString from 'query-string';

const Stack = createStackNavigator();

const App = () => {

  useEffect(() => {
    // Listener para eventos enviados desde el código nativo
    const subscription = DeviceEventEmitter.addListener('openScreen', (screenName) => {
      console.log("screenName ===> ", screenName)
      if (screenName) {
        handleNavigation(screenName);
      }
    });

    // Limpieza al desmontar
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url; // URL recibida como callback
      console.log("url ==> ", url);
      if (url) {
        // Analiza los parámetros usando query-string
        const parsed = queryString.parseUrl(url);
        const { status, resultado } = parsed.query;
        Alert.alert('Callback recibido', `Status: ${status}, Resultado: ${resultado}`);

        console.log("Callback ==> " + resultado)
        Alert.alert('Callback recibido', `Status: ${status}, Resultado: ${resultado}`);
      }
    };

    Linking?.addEventListener('url', handleDeepLink);

    // Limpieza del listener al desmontar el componente
    return () => {
      Linking?.removeEventListener('url', handleDeepLink);
    };
  }, []);

  const handleNavigation = (screenName) => {
    // Accede al navegador global
    if (navigationRef.current?.navigate) {
      navigationRef.current.navigate(screenName);
    } else {
      console.warn('No se pudo navegar, el navegador no está disponible');
    }
  };

  const navigationRef = React.useRef();

  const linking = {
    // Los prefijos aceptados por el contenedor de navegación deben coincidir con los esquemas agregados (androidManifest)
    prefixes: ["testgoogle://"],
    // Configuración de ruta a mapear
    config: {
      // Nombre de ruta inicial que se agregará a la pila antes de cualquier navegación posterior.
      // Debe coincidir con una de las pantallas disponibles
      initialRouteName: "Home" as const,
      screens: {
        // testgoogle://home -> HomeScreen
        Home: "home",
        // testgoogle://details/1 -> DetailsScreen con param id: 1
        Details: "details/:id",
      },
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef} //Para mantener la navegacion
      linking={linking} // Para configurar los App Links
      fallback={<Text>Cargando...</Text>} // Pantalla que se muestra al cargar
    >
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
  },
  button: {
    padding: 10,
    borderBottomWidth: 1,
  },
});

/**
 * Data
 */
const lista = [
  { id: 1, name: "Apples" },
  { id: 2, name: "Bananas" },
  { id: 3, name: "Oranges" },
  { id: 4, name: "Milk" },
  { id: 5, name: "Bread" },
];

/**
 * Screens
 */
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Lista de compras APP 1</Text>
      <FlatList
        style={styles.list}
        data={lista}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 10, borderBottomWidth: 1 }}
            onPress={() => navigation.navigate("Details", { id: item.id })}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }) {

  console.log("Params ", route)

  const abrirApp = async () => {

    const packageName = 'com.farmaciasahorro';
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    const deepLink = `testapp://consulta?param1=${"Parametro 1"}&param2=${"Parametro 2"}`

    try {
      const open = await Linking.openURL(deepLink);
      console.log("open ", open);
      if (!open) {
        Alert.alert(
          "Aplicación no encontrada",
          "¿Deseas instalarla desde la tienda?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Instalar", onPress: () => Linking.openURL(playStoreUrl) },
          ]
        );
      }
    } catch (error) {
      console.error("Error abriendo la app:", error);
      Alert.alert("Error", "No se pudo abrir la aplicación.");
    }
  };

  return (
    <View style={styles.container}>
      <Text>
        Producto:
        {lista.find((item) => item.id === Number(route.params.id))
          ?.name ?? "Not Found"}
      </Text>
      <Button title="abrir app" onPress={() => {
        abrirApp()
        // navigation.goBack()
      }} />
    </View>
  );
}

export default App;
