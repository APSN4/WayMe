import './App.css'
import {MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import L from 'leaflet';
import {useEffect, useRef, useState} from "react";
import {
    Box,
    VStack,
    Input,
    Text,
    Checkbox,
    Heading,
    Image,
    Flex,
    Switch, HStack, Button,
} from '@chakra-ui/react';

function App() {

    const [startPosition, setStartPosition] = useState([55.743580, 37.630657]);
    const [endPosition, setEndPosition] = useState([55.733280, 37.609791]);
    const [position, setPosition] = useState([55.746667, 37.606545])
    const isFirstRender = useRef(true);
    const [markers, setMarkers] = useState([]);

    const RoutingComponent = ({ startPositionLocal, endPositionLocal }: any) => {
        const map = useMap();
        const routingControlRef = useRef<L.Routing.Control | null>(null);

        // Используем событие карты для добавления маршрута
        if (map) {
            if (isFirstRender.current ||
                startPosition[0] !== startPositionLocal[0] ||
                startPosition[1] !== startPositionLocal[1] ||
                endPosition[0] !== endPositionLocal[0] ||
                endPosition[1] !== endPositionLocal[1]) {
                if (routingControlRef.current) {
                    // Удаляем старый маршрут, если он существует
                    routingControlRef.current.getPlan().spliceWaypoints(0, 1)
                    routingControlRef.current.remove();
                }

                // Создаем новый маршрут
                routingControlRef.current = L.Routing.control({
                    waypoints: [
                        L.latLng(startPositionLocal),
                        L.latLng(endPositionLocal)
                    ],
                }).addTo(map);

                routingControlRef.current.on('routesfound', (event) => {
                    console.log(event)
                    const waypoints = routingControlRef.current?.getPlan().getWaypoints();
                    const firstPoint = waypoints?.[0]?.latLng;
                    // Собираем все промисы в массив
                    const markerPromises = event.routes[0].coordinates.map(coord =>
                        RequestGetMarkers(coord.lng, coord.lat, 1)
                    );

                    // Ждем завершения всех запросов
                    Promise.all(markerPromises)
                        .then(results => {
                            const markerMap = {};

                            // Обрабатываем все результаты
                            results.flat().forEach((item, index) => {
                                const lat = item.coordinates_float[1]; // Широта
                                const lng = item.coordinates_float[0]; // Долгота
                                // Создаем уникальный ключ из округленных координат
                                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

                                // Добавляем маркер только если его еще нет
                                if (!markerMap[key]) {
                                    markerMap[key] = {
                                        id: Date.now() + index,
                                        position: [lat, lng],
                                        info: item.info
                                    };
                                }
                            });

                            // Преобразуем объект в массив для обновления состояния
                            const allNewMarkers = Object.values(markerMap);
                            setMarkers(allNewMarkers);
                        })
                        .catch(error => {
                            console.error('Ошибка при загрузке маркеров:', error);
                        });
                })
                isFirstRender.current = false;
            }
        }

        return null;
    };

    const MarkersLayer = () => {
        const map = useMap();

        useEffect(() => {
            var restaurantIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2151/2151973.png',
                iconSize: [30, 30]
            })
            const markerLayer = markers.map(marker => {
                const leafletMarker = L.marker(marker.position)
                    .addTo(map)
                    .bindPopup(() => {
                        // Создаем содержимое попапа из info
                        const popupContent = document.createElement('div');
                        if (typeof marker.info === 'object') {
                            // Если info - объект, выводим все его свойства
                            popupContent.innerHTML = Object.entries(marker.info)
                                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                                .join('<br>');
                        } else {
                            // Если info - строка или другой тип
                            popupContent.innerHTML = marker.info || 'Нет информации';
                        }
                        return popupContent;
                    })
                    .setIcon(restaurantIcon);

                return leafletMarker;
            });

            // Очистка при размонтировании или обновлении
            return () => {
                markerLayer.forEach(marker => map.removeLayer(marker));
            };
        }, [markers, map]);

        return null;
    };

    function MapCoordinatesTitle({ position }: any) {
        return (
            <p className="map-coordinates">
                Latitude: {position[0].toFixed(4)}, Longitude: {position[1].toFixed(4)}
            </p>
        );
    }

    function MapEventsHandler() {
        useMapEvents({
            moveend: (e) => {
                const map = e.target;
                setPosition([map.getCenter().lat, map.getCenter().lng]);
            },
        });
        return null;
    }

    async function RequestGetMarkers(x: number, y: number, r: number) {
        return fetch(`http://localhost:8080/v1/markers?x=${x}&y=${y}&radius=${r}`)
            .then((response) => response.json())
            .then((responseJson) => {
                return responseJson;
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const CustomAttribution = () => {
        const map = useMap();

        useEffect(() => {
            map.attributionControl.setPrefix("Dev version");
        }, [map]);

        return null;
    };

    return (
        <>
            <MapCoordinatesTitle position={position}/>
            <Flex justify="space-between">
                <div style={{width: "25vw"}}>
                    <Box w="25vw" h="100vh" p={4} bg="gray.50" overflowY="auto" boxShadow="md">
                        <VStack align="start" spacing={4}>
                            {/* Greeting */}
                            <Text fontSize="lg" color="gray.600">
                                👋 Привет, <b>мы тебя ждали!</b>
                            </Text>

                            {/* Search Bar */}
                            <Input
                                placeholder="Поиск мест..."
                                bg="white"
                                variant="outline"
                                _focus={{ bg: 'white' }}
                            />

                            {/* Filters */}
                            <Box w="100%">
                                <Heading as="h4" size="sm" mb={2}>
                                    Фильтры
                                </Heading>
                                <div>
                                    <Switch.Root style={{paddingRight: 8}}>
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Кафе</Switch.Label>
                                    </Switch.Root>
                                    <Switch.Root style={{paddingRight: 8}}>
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Рестораны</Switch.Label>
                                    </Switch.Root>
                                    <Switch.Root style={{paddingRight: 8}}>
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Быстрое питание</Switch.Label>
                                    </Switch.Root>
                                </div>
                            </Box>

                            {/* Gallery or Thumbnails */}
                            <Box w="100%">
                                <Heading as="h4" size="sm" mb={2}>
                                    Популярное
                                </Heading>
                                <Image
                                    src="https://avatars.mds.yandex.net/i?id=094ab2183726d3164c22d3f12d48fddd_l-10638774-images-thumbs&n=13"
                                    alt="Place 1"
                                    borderRadius="md"
                                    mb={2}
                                />
                                {/* AI Chat Assistant Inside Popular Section */}
                                <Box
                                    w="100%"
                                    bg="white"
                                    borderRadius="md"
                                    boxShadow="md"
                                    p={3}
                                    border="1px solid"
                                    borderColor="gray.200"
                                >
                                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                                        🤖 AI-помощник
                                    </Text>

                                    {/* Chat history placeholder */}
                                    <VStack
                                        align="start"
                                        spacing={2}
                                        maxH="200px"
                                        overflowY="auto"
                                        bg="gray.50"
                                        p={2}
                                        borderRadius="md"
                                    >
                                        <Box bg="purple.100" px={3} py={1} rounded="md">
                                            <Text fontSize="xs">Привет! Чем могу помочь?</Text>
                                        </Box>
                                    </VStack>

                                    {/* Message input */}
                                    <HStack mt={2}>
                                        <Input placeholder="Введите сообщение..." size="sm" />
                                        <Button size="sm" bg="purple.300">
                                            ➤
                                        </Button>
                                    </HStack>
                                </Box>
                            </Box>

                            {/* Recent Places */}
                            <Box w="100%">
                                <Heading as="h4" size="sm" mb={2}>
                                    Последние просмотренные места
                                </Heading>
                                <Text fontSize="sm" color="gray.500">Central Park</Text>
                                <Text fontSize="sm" color="gray.500">Louvre Museum</Text>
                                <Text fontSize="sm" color="gray.500">Brooklyn Bridge</Text>
                            </Box>
                        </VStack>
                    </Box>
                </div>
                <div style={{width: "75vw"}}>
                    <MapContainer
                        className="map-container"
                        center={[55.746667, 37.606545]}
                        zoom={15}
                        scrollWheelZoom={true}
                    >
                        <CustomAttribution/>
                        <TileLayer
                            attribution='WayMe'
                            url="http://www.google.cn/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i342009817!3m9!2sen-US!3sCN!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0&token=32965"
                        />
                        <RoutingComponent startPositionLocal={startPosition} endPositionLocal={endPosition}/>
                        <MarkersLayer/>
                        <MapEventsHandler/>
                    </MapContainer>
                </div>
            </Flex>
        </>
    );
}

export default App
