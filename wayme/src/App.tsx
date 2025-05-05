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
    Text,
    Heading,
    Image,
    Flex,
    Switch, Link,
} from '@chakra-ui/react';
import { useCookies } from 'react-cookie'
import SearchPlaces from "@/components/searchEngine/searchEngine.tsx";
import AssistantChatDialog from "@/components/AI/assistant.tsx";

function App() {

    const [startPosition, setStartPosition] = useState([55.743580, 37.630657]);
    const [endPosition, setEndPosition] = useState([55.733280, 37.609791]);
    const [position, setPosition] = useState([55.746667, 37.606545])
    const isFirstRender = useRef(true);
    const [markers, setMarkers] = useState([]);

    const [cookies, setCookie, removeCookie] = useCookies(['last_places'])
    const routingControlRef = useRef<L.Routing.Control | null>(null);

    const [isOpenAI, setIsOpenAI] = useState(false);

    interface ILastPlaces {
        places: IPlace[]
    }

    interface IPlace {
        name: string
        lat: number
        lng: number
    }

    const [filters, setFilters] = useState({
        cafe: true,
        restaurants: true,
        fastFood: true,
    });

    interface IIconType {
        [key: string]: [string, [number, number]];
    }

    const [iconType] = useState<IIconType>({
        "кафе": ['https://cdn-icons-png.flaticon.com/512/2917/2917114.png', [30, 30]],
        "ресторан": ['https://cdn-icons-png.flaticon.com/512/2276/2276934.png', [30, 30]],
        "столовая": ['https://cdn-icons-png.flaticon.com/512/3098/3098401.png', [30, 30]],
        "кафетерий": ['https://cdn-icons-png.flaticon.com/512/3496/3496508.png', [30, 30]],
        "буфет": ['https://cdn-icons-png.flaticon.com/512/531/531193.png', [30, 30]],
        "закусочная": ['https://cdn-icons-png.flaticon.com/512/1812/1812086.png', [30, 30]],
        "предприятие быстрого обслуживания": ['https://cdn-icons-png.flaticon.com/512/2151/2151973.png', [30, 30]],
        "бар": ['https://cdn-icons-png.flaticon.com/512/931/931949.png', [30, 30]],
        "ночной клуб (дискотека)": ['https://cdn-icons-png.flaticon.com/512/7615/7615010.png', [30, 30]],
        "магазин (отдел кулинарии)": ['https://cdn-icons-png.flaticon.com/512/869/869636.png', [30, 30]],
        "заготовочный цех": ['https://cdn-icons-png.flaticon.com/512/4125/4125849.png', [30, 30]],
    })

    const filtersRef = useRef(filters);

    const handleToggle = (filterName: keyof typeof filters, isChecked: boolean) => {
        const updatedFilters = {
            ...filters,
            [filterName]: isChecked,
        };

        setFilters(updatedFilters);         // перерисовываем UI
        filtersRef.current = updatedFilters; // обновляем ref для запроса
    };

    const RoutingComponent = ({ routingControlRefCopy, startPositionLocal, endPositionLocal }: any) => {
        const map = useMap();
        const routingControlRef = routingControlRefCopy;

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
                    router: L.Routing.osrmv1({
                        serviceUrl: 'http://localhost:5000/route/v1'
                    }),
                    // @ts-ignore
                    createMarker: function(i, waypoint, n) {
                        const startIcon = L.icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3603/3603850.png',
                            iconSize: [32, 32],
                            iconAnchor: [16, 32]
                        });

                        const endIcon = L.icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
                            iconSize: [32, 32],
                            iconAnchor: [16, 32]
                        });

                        const marker = L.marker(waypoint.latLng, {
                            icon: i === 0 ? endIcon : startIcon,
                            draggable: true
                        });

                        return marker;
                    }
                }).addTo(map);

                routingControlRef.current.on('routesfound', (event) => {
                    console.log(event)
                    // Собираем все промисы в массив
                    const markerPromises = event.routes[0].coordinates.map(coord =>
                        RequestGetMarkers(coord.lng, coord.lat, 1, filtersRef.current)
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
                    // cookie place
                    const destinationIndex = event.routes[0].waypoints.length - 1;
                    let newPlace: IPlace = {
                        name: event.routes[0].name,
                        lat: event.routes[0].waypoints[destinationIndex].latLng.lat,
                        lng: event.routes[0].waypoints[destinationIndex].latLng.lng
                    }
                    let placesObj: ILastPlaces = cookies.last_places || { places: [] };
                    let existPlace = placesObj.places.some(place => place.name === newPlace.name);
                    if (!existPlace) {
                        if (placesObj.places.length < 3) {
                            // Если меньше 3 мест, добавляем новое в начало
                            placesObj.places.unshift(newPlace);
                        } else {
                            // Если уже 3 места, удаляем последнее и добавляем новое в начало
                            placesObj.places.pop();
                            placesObj.places.unshift(newPlace);
                        }
                        setCookie('last_places', placesObj, { path: '/' });
                    }
                })
                isFirstRender.current = false;
            }
        }

        return null;
    };

    const MarkersLayer = () => {
        const map = useMap();

        useEffect(() => {
            const markerLayer = markers.map(marker => {
                const icon = L.icon({
                    iconUrl: iconType[marker.info.TypeObject][0],
                    iconSize: iconType[marker.info.TypeObject][1]
                });
                const leafletMarker = L.marker(marker.position)
                    .addTo(map)
                    .bindPopup(() => {
                        const { Name, Address, TypeObject, PublicPhone } = marker.info || {};

                        const popupHTML = `
                            <div style="
                              background: white;
                              padding: 12px;
                              border-radius: 8px;
                              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                              min-width: 200px;
                              font-family: system-ui, sans-serif;
                            ">
                              ${Name ? `<h3 style="margin: 0 0 6px; font-size: 16px;">${Name}</h3>` : ''}
                              ${TypeObject ? `<div style="color: gray; font-size: 14px;"><strong>Тип</strong>: ${TypeObject}</div>` : ''}
                              ${Address ? `<div style="color: gray; font-size: 14px;"><strong>Адрес</strong>: ${Address}</div>` : ''}
                              ${PublicPhone[0].PublicPhone ? `<div style="color: gray; font-size: 14px;"><strong>Телефон</strong>: ${PublicPhone[0].PublicPhone}</div>` : ''}
                            </div>
                          `;

                        const container = document.createElement('div');
                        container.innerHTML = popupHTML;
                        return container;
                    })
                    .setIcon(icon);

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

    async function RequestGetMarkers(x: number, y: number, r: number, filtersRef: any) {
        const entries = Object.entries(filtersRef);

        const countTrue = entries.filter(([_, v]) => v).length;
        const totalFilters = entries.length;

        let filterQuery = '';

        if (countTrue === totalFilters) {
            filterQuery = '&filter=all';
        } else if (countTrue === 0) {
            filterQuery = '';
        } else {
            filterQuery = `&filter=${entries.filter(([_, v]) => v).map(([k]) => k).join(',')}`;
        }

        return fetch(`http://localhost:8080/v1/markers?x=${x}&y=${y}&radius=${r}${filterQuery}`)
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

                            <SearchPlaces routingControlRef={routingControlRef} />

                            {/* Filters */}
                            <Box w="100%">
                                <Heading as="h4" size="sm" mb={2}>
                                    Фильтры
                                </Heading>
                                <div>
                                    <Switch.Root
                                        checked={filters.cafe}
                                        onCheckedChange={({ checked }) => handleToggle('cafe', checked)}
                                        style={{paddingRight: 8}}
                                    >
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Кафе</Switch.Label>
                                    </Switch.Root>
                                    <Switch.Root
                                        checked={filters.restaurants}
                                        onCheckedChange={({ checked }) => handleToggle('restaurants', checked)}
                                        style={{paddingRight: 8}}
                                    >
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>Рестораны</Switch.Label>
                                    </Switch.Root>
                                    <Switch.Root
                                        checked={filters.fastFood}
                                        onCheckedChange={({ checked }) => handleToggle('fastFood', checked)}
                                        style={{paddingRight: 8}}
                                    >
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
                                <AssistantChatDialog routingControlRef={routingControlRef} />
                            </Box>

                            {/* Recent Places */}
                            <Box w="100%">
                                <Heading as="h4" size="sm" mb={2}>
                                    Последние просмотренные места
                                </Heading>
                                {cookies.last_places != undefined ? (
                                    cookies.last_places.places.map((place: IPlace, index: number) => (
                                        <Link
                                            key={place.name}
                                            fontSize="sm"
                                            color="gray.500"
                                            display="block"
                                            onClick={() => {
                                                if (routingControlRef.current) {
                                                    const currentWaypoints = routingControlRef.current?.getWaypoints()
                                                    const currentStartPosition = currentWaypoints?.[0].latLng
                                                    const distance = currentStartPosition.distanceTo([place.lat, place.lng]);
                                                    if (distance < 5) return;

                                                    routingControlRef.current.setWaypoints([
                                                        currentStartPosition,
                                                        L.latLng(place.lat, place.lng)
                                                    ]);
                                                }
                                            }}
                                        >
                                            {place.name}
                                        </Link>
                                    ))
                                ) : (
                                    <Text fontSize="sm" color="gray.500">
                                        No recent places found
                                    </Text>
                                )}
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
                        <RoutingComponent routingControlRefCopy={routingControlRef} startPositionLocal={startPosition} endPositionLocal={endPosition}/>
                        <MarkersLayer/>
                        <MapEventsHandler/>
                    </MapContainer>
                </div>
            </Flex>
        </>
    );
}

export default App
