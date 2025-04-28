import {useState, useEffect, useRef} from "react";
import {
    Badge,
    Box,
    CloseButton,
    DataList,
    Dialog,
    Input,
    Portal,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";
import L from "leaflet";

const client = new MeiliSearch({ host: "http://localhost:7700" });

interface SearchPlacesDialogProps {
    routingControlRef: any;
}

export default function SearchPlacesDialog({ routingControlRef }: SearchPlacesDialogProps) {
    const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const closeDialogRef = useRef(null);

    useEffect(() => {
        // Проверяем доступность сервера
        const checkServer = async () => {
            try {
                await client.getStats(); // любой запрос к серверу
                setIsServerOnline(true);
            } catch (error) {
                setIsServerOnline(false);
            }
        };
        checkServer();
    }, []);

    useEffect(() => {
        if (query.length === 0) {
            setResults([]);
            return;
        }
        const fetchResults = async () => {
            setLoading(true);
            try {
                const search = await client.index("data_places").search(query, { limit: 5 });
                setResults(search.hits);
            } catch (error) {
                console.error("Ошибка поиска:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [query]);

    return (
        <VStack alignItems="start" width="100%" maxW="100%">
            <Dialog.Root>
                <Dialog.Trigger asChild>
                    <Box width="100%" maxW="100%" flex="1" cursor="pointer">
                        <Input
                            placeholder="Поиск мест..."
                            bg="white"
                            variant="outline"
                            width="100%"
                            py={5}
                            borderRadius="md"
                            pointerEvents="none"
                        />
                    </Box>
                </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Поиск мест</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body pb="8">
                                <DataList.Root orientation="horizontal">
                                    <DataList.Item>
                                        <DataList.ItemLabel>Статус сервера</DataList.ItemLabel>
                                        <DataList.ItemValue>
                                            {isServerOnline === null ? (
                                                <Badge colorPalette="gray">Проверка...</Badge>
                                            ) : isServerOnline ? (
                                                <Badge colorPalette="green">Работает</Badge>
                                            ) : (
                                                <Badge colorPalette="red">Отключен</Badge>
                                            )}
                                        </DataList.ItemValue>
                                    </DataList.Item>
                                </DataList.Root>

                                <VStack spacing={4} mt={6}>
                                    <Input
                                        placeholder="Поиск мест..."
                                        bg="white"
                                        variant="outline"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        _focus={{ bg: "white" }}
                                    />

                                    {loading && <Spinner />}

                                    {results.length > 0 && (
                                        <VStack spacing={2} align="stretch" width="100%">
                                            {results.map((hit) => (
                                                <Box
                                                    key={hit.id}
                                                    p={3}
                                                    borderWidth="1px"
                                                    borderRadius="md"
                                                    bg="gray.50"
                                                    _hover={{ bg: "gray.100" }}
                                                    cursor="pointer"
                                                    onClick={() => {
                                                        if (routingControlRef.current) {
                                                            const currentWaypoints = routingControlRef.current?.getWaypoints();
                                                            const currentStartPosition = currentWaypoints?.[0]?.latLng;
                                                            routingControlRef.current.setWaypoints([
                                                                currentStartPosition,
                                                                L.latLng(hit.geoData.coordinates[1], hit.geoData.coordinates[0])
                                                            ]);
                                                        }
                                                        closeDialogRef.current?.click();
                                                    }}
                                                >
                                                    <Text fontWeight="bold">
                                                        🍽️ Название: {hit.Title || hit.Name || "Без названия"}
                                                    </Text>
                                                    <Text fontWeight="bold">
                                                        🏨 Район: {hit.District || "Район не указан"}
                                                    </Text>
                                                    <Text fontWeight="bold">
                                                        🏷️ Тип: {hit.TypeObject || "Тип не указан"}
                                                    </Text>
                                                    <Text fontWeight="normal" color="gray.600" fontSize="sm">
                                                        📍 {hit.Address || "Адрес не указан"}
                                                    </Text>

                                                </Box>
                                            ))}
                                        </VStack>
                                    )}
                                </VStack>
                            </Dialog.Body>
                            <Dialog.CloseTrigger asChild ref={closeDialogRef}>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </VStack>
    );
}
