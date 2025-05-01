package api

import (
	"core/internal"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func LLMPipeline(c *gin.Context) {
	var textRequest internal.LLMRequest
	if err := c.ShouldBindJSON(&textRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prompt := internal.PromptingRequest(textRequest)
	sqlText := internal.GeneratingLLM(prompt)
	sqlText = internal.ValidatorSQL(sqlText)
	point := internal.ExecuteSQL(sqlText)
	fmt.Println(point)
}
