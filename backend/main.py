"""
Greenmind API - FastAPI Backend
AI-powered garden design assistant
"""

import json
import os
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Greenmind API",
    description="Backend API for the Greenmind AI Garden Design App",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to frontend public assets
PUBLIC_DIR = Path(__file__).parent.parent / "frontend" / "public"


class DesignRequest(BaseModel):
    style_preference: str | None = None
    yard_size: str | None = None
    climate_zone: str | None = None


class DesignConcept(BaseModel):
    name: str
    style: str
    description: str
    key_features: list[str]
    estimated_cost_range: str


@app.get("/")
def root():
    return {"app": "Greenmind API", "version": "0.1.0", "status": "running"}


@app.get("/api/plants")
def get_plants():
    """Return plant schedule data from CSV."""
    csv_path = PUBLIC_DIR / "plant_schedule.csv"
    df = pd.read_csv(csv_path)
    return df.to_dict(orient="records")


@app.get("/api/bom")
def get_bom():
    """Return bill of materials from CSV."""
    csv_path = PUBLIC_DIR / "sample_bom.csv"
    df = pd.read_csv(csv_path)
    return df.to_dict(orient="records")


@app.get("/api/layout")
def get_layout():
    """Return garden layout JSON."""
    json_path = PUBLIC_DIR / "layout.json"
    with open(json_path) as f:
        return json.load(f)


@app.post("/api/design")
def generate_design(request: DesignRequest | None = None):
    """
    Mock AI endpoint for generating garden design concepts.
    In production, this would call an AI model (e.g., Claude, GPT-4, or a
    custom fine-tuned model) to generate designs based on the uploaded photo
    and user preferences.
    """
    return {
        "concepts": [
            DesignConcept(
                name="Modern Oasis",
                style="modern",
                description="Clean lines with structured native plantings, "
                "architectural grasses, and a minimalist water feature.",
                key_features=[
                    "Native grass borders",
                    "Concrete stepping stones",
                    "LED garden lighting",
                    "Drip irrigation system",
                ],
                estimated_cost_range="$4,000 - $6,500",
            ),
            DesignConcept(
                name="Cottage Charm",
                style="cottage",
                description="Lush, informal planting with roses, lavender, and "
                "perennials. A romantic, lived-in garden feel.",
                key_features=[
                    "Mixed flower borders",
                    "Stone pathway",
                    "Wooden arbor",
                    "Herb spiral",
                ],
                estimated_cost_range="$3,500 - $5,500",
            ),
            DesignConcept(
                name="Zen Minimalist",
                style="minimalist",
                description="Less is more. Bold specimen plants, open space, "
                "and a calming palette of greens and whites.",
                key_features=[
                    "Specimen trees",
                    "Gravel garden beds",
                    "Stone bench seating",
                    "Bamboo screening",
                ],
                estimated_cost_range="$3,000 - $5,000",
            ),
        ],
        "generation_id": "demo-001",
        "model": "greenmind-v0.1-mock",
    }


@app.post("/api/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    """
    Handle yard photo upload.
    In production, this would:
    1. Store the image
    2. Run it through a vision model for yard analysis
    3. Return detected features (lawn area, existing plants, structures, etc.)
    """
    return {
        "filename": photo.filename,
        "content_type": photo.content_type,
        "analysis": {
            "detected_features": [
                "Open lawn area (~80 sqm)",
                "Existing fence line (timber, 15m)",
                "Partial shade from neighboring tree",
                "Slight slope towards rear",
            ],
            "estimated_area": "120 sqm",
            "soil_type_guess": "Loamy clay",
            "sun_exposure": "Full sun (front), Part shade (rear)",
        },
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
