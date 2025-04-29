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

}
