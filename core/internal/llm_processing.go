package internal

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
)

type LLMProcessing interface {
	PromptingRequest(textRequest LLMRequest) string
	GeneratingLLM(prompt string) string
	ValidatorSQL(response string) string
	ExecuteSQL(sqlRequest string) PlaceDB
}

func PromptingRequest(textRequest LLMRequest) string {
	prompt := `Ты — генератор SQL-запросов. Пользователь пишет запрос на русском языке.
Твоя задача: СГЕНЕРИРОВАТЬ КОРРЕКТНЫЙ SQL ЗАПРОС для SQLite3, который получает ТОЛЬКО поле global_id из таблицы place_dbs.

⚠️ ПРАВИЛА:
- ВСЕГДА возвращай только одно поле: global_id.
- НЕ добавляй пояснений, текста, комментариев, кавычек, markdown-блоков
- НЕ возвращай названия, телефоны, координаты и другие поля.
- НЕ придумывай значения (например, телефоны или ID).
- ЕСЛИ пользователь просит "любую точку" — используй LIMIT 1.
- ЕСЛИ упоминается часть названия (например, "KFC") — используй условие: WHERE LOWER(name) LIKE '%kfc%' LIMIT 1;

❌ Примеры НЕПРАВИЛЬНЫХ ответов:
Вот SQL-запрос: SELECT * FROM place_dbs ...
SELECT name, number FROM ...
Только с телефоном.

✅ Примеры ПРАВИЛЬНЫХ ответов:
SELECT global_id FROM place_dbs WHERE LOWER(name) LIKE '%kfc%' LIMIT 1;

---

Структура таблиц:

Таблица: place_dbs
- id: UUID
- created_at: timestamp
- updated_at: timestamp
- name: text (название объекта)
- global_id: integer (уникальный ключ)
- is_net_object: text
- operating_company: text (оператор)
- type_object: text (тип объекта например: кафе, ресторан)
- adm_area: text (административный округ например: "Центральный административный округ")
- district: text (район, например: "район Арбат")
- address: text (адрес)
- seats_count: integer (количество мест)
- social_privileges: text
- longitude: text (долгота WGS84)
- latitude: text (широта WGS84)

Таблица: phone_dbs
- id: UUID
- place_id: UUID (внешний ключ на place_dbs.id)
- number: text (телефон без страны +7)

---

Запрос пользователя: ` + textRequest.Text

	return prompt
}

func GeneratingLLM(prompt string) string {
	reqBody, err := json.Marshal(map[string]interface{}{
		"model":  "gemma3:12b",
		"prompt": prompt,
		"stream": false,
		"raw":    true,
	})
	if err != nil {
		log.Println("err Marshal in GeneratingLLM", err)
		return ""
	}
	resp, err := http.Post("http://localhost:11434/api/generate",
		"application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		log.Println("err Post in GeneratingLLM", err)
		return ""
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("err body in GeneratingLLM", err)
		return ""
	}

	var ollamaResp OllamaResponse
	if err = json.Unmarshal(body, &ollamaResp); err != nil {
		log.Println("Error unmarshaling JSON:", err)
		return ""
	}
	return ollamaResp.Response
}

func ValidatorSQL(response string) string {
	re := regexp.MustCompile("(?s)```(?:\\w*\\n)?(.*?)```")
	matches := re.FindStringSubmatch(response)

	if len(matches) < 2 {
		log.Println("no SQL code found between backticks")
		return ""
	}

	cleanSQL := strings.TrimSpace(matches[1])
	cleanSQL = strings.ReplaceAll(cleanSQL, "\n", " ")
	cleanSQL = strings.ReplaceAll(cleanSQL, "\t", " ")
	cleanSQL = regexp.MustCompile(`\s+`).ReplaceAllString(cleanSQL, " ")

	return cleanSQL
}

func ExecuteSQL(sqlRequest string) PlaceDB {
	point, err := ExecutePlaceSQL(sqlRequest)
	if err != nil {
		log.Println("err in ExecuteSQL")
	}
	return point
}
