package api

import (
	"core/internal"
	"github.com/gin-gonic/gin"
	"net/http"
)

func LLMPipeline(c *gin.Context) {
	var textRequest internal.LLMRequest
	if err := c.ShouldBindJSON(&textRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prompt := internal.PromptingRequest(1, textRequest)
	sqlText := internal.GeneratingLLM(prompt)
	sqlText = internal.ValidatorSQL(sqlText)
	point := internal.ExecuteSQL(sqlText)

	var textData internal.LLMRequest
	if point.Longitude != "" && point.Latitude != "" {
		textData.Text = "Запрос от пользователя: " + textRequest.Text + " Название: " + point.Name + " Адрес: " + point.Address
	} else {
		textData.Text = "Запрос от пользователя: " + textRequest.Text + " - Ничего не найдено."
	}
	promptAnswer := internal.PromptingRequest(2, textData)
	answerText := internal.GeneratingLLM(promptAnswer)

	c.JSON(http.StatusOK, internal.LLMPipelineResponse{Point: point.ToDomainModel(), ResponseText: answerText})
}
