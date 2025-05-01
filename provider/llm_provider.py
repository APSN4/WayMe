from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gradio_client import Client
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Prompt Processing API", version="1.0.0")


# Request model
class PromptRequest(BaseModel):
    prompt: str
    max_tokens: int = 2048
    temperature: float = 0.3
    top_p: float = 0.0
    top_k: int = 0


# Response model
class PromptResponse(BaseModel):
    response: str
    status: str
    model: str


class PromptService:
    def __init__(self):
        self.client = Client("amd/llama4-maverick-17b-128e-mi-amd")
        self.model_name = "llama4-maverick-17b-128e-mi-amd"

    async def process_prompt(self, request: PromptRequest) -> PromptResponse:
        try:
            result = self.client.predict(
                message={"text": request.prompt},
                param_2="",
                param_3=request.max_tokens,
                param_4=request.temperature,
                param_5=request.top_p,
                param_6=request.top_k,
                api_name="/chat"
            )
            return PromptResponse(
                response=result,
                status="success",
                model=self.model_name
            )
        except Exception as e:
            logger.error(f"Error processing prompt: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Model processing failed: {str(e)}")


# Initialize service
prompt_service = PromptService()


@app.post("/process_prompt", response_model=PromptResponse)
async def process_prompt(request: PromptRequest):
    """
    Process a prompt and return the model's response.

    Args:
        request: PromptRequest containing the prompt and optional parameters

    Returns:
        JSON response with the model's output and status
    """
    try:
        response = await prompt_service.process_prompt(request)
        return JSONResponse(content=response.dict())
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify service status
    """
    return {"status": "healthy", "model": prompt_service.model_name}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)