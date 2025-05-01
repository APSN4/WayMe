import { useState, useRef, useEffect } from "react";
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    HStack,
    Input,
    Portal,
    Text,
    VStack,
} from "@chakra-ui/react";
import L from "leaflet";

interface AssistantChatDialogProps {
    routingControlRef?: any; // Optional prop to maintain compatibility if needed
}

export default function AssistantChatDialog({ routingControlRef }: AssistantChatDialogProps) {
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
        { sender: "AI", text: "Привет! Чем могу помочь?" },
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const closeDialogRef = useRef<HTMLButtonElement>(null);

    const loadingPhrases: string[] = [
        "Загрузка летит, как космический шаттл!",
        "Данные мчатся быстрее ветра!",
        "Прогресс бар танцует, держись!",
        "Загрузка на максималках, как супергерой!",
        "Биты и байты спешат к тебе!",
        "Загружаем магию, подожди чуток!",
        "Скорость света? Пф, мы быстрее!",
        "Загрузка качает, как рок-звезда!"
    ];

    interface Phone {
        PublicPhone: string;
    }

    interface Point {
        ID: string;
        Name: string;
        global_id: number;
        IsNetObject: string;
        OperatingCompany: string;
        TypeObject: string;
        AdmArea: string;
        District: string;
        Address: string;
        PublicPhone: Phone[];
        SeatsCount: number;
        SocialPrivileges: string;
        Longitude_WGS84: string;
        Latitude_WGS84: string;
    }

    interface ResponseData {
        point: Point;
        response_text: string;
    }

    // Scroll to the bottom of the chat when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getRandomPhrase = (phrases) => {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        return phrases[randomIndex];
    };

    // Handle sending a message
    const handleSendMessage = async () => {
        let inputLocal = input
        if (inputLocal.trim() === "") return;

        setInput("");

        // Add user message
        setMessages((prev) => [...prev, {sender: "User", text: inputLocal}]);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { sender: "AI", text: getRandomPhrase(loadingPhrases) },
            ]);
        }, 500);

        let responseLLM: ResponseData | null = await RequestLLM(inputLocal)

        if (responseLLM != null) {
            setMessages((prev) => [
                ...prev,
                {sender: "AI", text: responseLLM.response_text},
            ]);
        } else {
            setMessages((prev) => [
                ...prev,
                {sender: "AI", text: "Что-то пошло не так. Попробуйте еще раз."},
            ]);
        }

        if (routingControlRef.current) {
            const currentWaypoints = routingControlRef.current?.getWaypoints()
            const currentStartPosition = currentWaypoints?.[0].latLng
            routingControlRef.current.setWaypoints([
                currentStartPosition,
                L.latLng(parseFloat(responseLLM?.point.Latitude_WGS84 as string), parseFloat(responseLLM?.point.Longitude_WGS84 as string))
            ]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    async function RequestLLM(text: string) {

        return fetch('http://localhost:8080/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        })
            .then((response) => response.json())
            .then((responseJson): ResponseData => {
                return responseJson;
            })
            .catch((error) => {
                console.error(error);
                return null
            });
    }

    return (
        <VStack alignItems="start" width="100%" maxW="100%">
            <Dialog.Root>
                <Dialog.Trigger asChild>
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
                            <Button size="sm" bg="purple.300">
                                ➤
                            </Button>
                        </HStack>
                    </Box>
                </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content maxW="400px">
                            <Dialog.Header>
                                <Dialog.Title>🤖 AI-помощник</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body pb="8">
                                <VStack
                                    align="start"
                                    spacing={2}
                                    maxH="300px"
                                    overflowY="auto"
                                    bg="gray.50"
                                    p={3}
                                    borderRadius="md"
                                >
                                    {messages.map((msg, index) => (
                                        <Box
                                            key={index}
                                            bg={msg.sender === "AI" ? "purple.100" : "blue.100"}
                                            px={3}
                                            py={1}
                                            rounded="md"
                                            alignSelf={msg.sender === "AI" ? "flex-start" : "flex-end"}
                                        >
                                            <Text fontSize="sm">{msg.text}</Text>
                                        </Box>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </VStack>
                                <HStack mt={4}>
                                    <Input
                                        placeholder="Введите сообщение..."
                                        size="sm"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        bg="white"
                                        variant="outline"
                                        _focus={{ bg: "white" }}
                                    />
                                    <Button size="sm" bg="purple.300" onClick={handleSendMessage}>
                                        ➤
                                    </Button>
                                </HStack>
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