package internal

type LLMProcessing interface {
	PromptingRequest(textRequest LLMRequest) string
	GeneratingLLM(prompt string) string
	ValidatorSQL(answer string) string
	ExecuteSQL(sqlRequest string) interface{}
}

func PromptingRequest(textRequest LLMRequest) string {
	return ""
}
