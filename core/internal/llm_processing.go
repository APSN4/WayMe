package internal

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

type LLMProcessing interface {
	PromptingRequest(textRequest LLMRequest) string
	GeneratingLLM(prompt string) string
	ValidatorSQL(response string) string
	ExecuteSQL(sqlRequest string) PlaceDB
}

func PromptingRequest(promptNumber int, textRequest LLMRequest) string {
	var knowledge KnowledgeDB
	result := ConDB.First(&knowledge, "number = ?", strconv.Itoa(promptNumber))

	if result.Error != nil {
		return ""
	}

	prompt := knowledge.Prompt + textRequest.Text

	return prompt
}

func GeneratingLLM(prompt string) string {
	reqBody, err := json.Marshal(map[string]interface{}{
		"prompt": prompt,
	})
	if err != nil {
		log.Println("err Marshal in GeneratingLLM", err)
		return ""
	}
	resp, err := http.Post("http://localhost:8000/process_prompt",
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

	var LLMResp LLMResponse
	if err = json.Unmarshal(body, &LLMResp); err != nil {
		log.Println("Error unmarshaling JSON:", err)
		return ""
	}
	return LLMResp.Response
}

func ValidatorSQL(response string) string {
	re := regexp.MustCompile("(?s)```(?:\\w*\\n)?(.*?)```")
	matches := re.FindStringSubmatch(response)

	cleanSQL := response

	if strings.Contains(response, "```") {
		if len(matches) < 2 {
			log.Println("no SQL code found between backticks")
			return ""
		}
		cleanSQL = strings.TrimSpace(matches[1])
	}

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
