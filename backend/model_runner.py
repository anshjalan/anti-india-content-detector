import sys
import json
import torch
import torch.nn.functional as F
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

def clean_text(text):
    """Clean and validate text input for the tokenizer."""
    if not text or not isinstance(text, str):
        return None  # Return None instead of empty string
    
    # Convert to string and remove excessive whitespace
    cleaned = str(text).strip()
    
    # Remove non-printable characters that might cause issues
    cleaned = ''.join(char for char in cleaned if char.isprintable() or char.isspace())
    
    # Handle empty strings after cleaning
    if not cleaned or len(cleaned) < 2:  # Require at least 2 characters
        return None
    
    # Ensure the text isn't too long (tokenizer limit)
    if len(cleaned) > 10000:  # Reasonable limit
        cleaned = cleaned[:10000]
    
    return cleaned

def analyze_comments(comments, threshold=0.8):
    """Analyzes a list of comment objects using the ML model."""
    try:
        # 1. Load Model (only once)
        MODEL_DIR = "./distilbert_pseudo_model"
        tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
        model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()

        # 2. Clean and validate comments
        valid_comments = []
        valid_texts = []
        
        for i, c in enumerate(comments):
            if not c or not isinstance(c, dict):
                continue
                
            text = c.get('text', '')
            cleaned_text = clean_text(text)
            
            # Only include comments with actual text content
            if cleaned_text is not None:
                valid_comments.append(c)
                valid_texts.append(cleaned_text)

        if not valid_texts:
            return [], []

        # 3. Additional validation - ensure all texts are proper strings
        validated_texts = []
        final_comments = []
        
        for i, text in enumerate(valid_texts):
            if isinstance(text, str) and len(text.strip()) > 0:
                validated_texts.append(text)
                final_comments.append(valid_comments[i])

        if not validated_texts:
            return [], []

        # 4. Tokenization
        inputs = tokenizer(
            validated_texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors="pt"
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # 5. Predict with confidence scores
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = F.softmax(logits, dim=-1)
            confidences, predictions = torch.max(probs, dim=1)
            confidences = confidences.cpu().numpy()
            predictions = predictions.cpu().numpy()

        # 6. Filter based on confidence threshold
        filtered_preds = []
        filtered_comments = []
        for i, conf in enumerate(confidences):
            if conf >= threshold:
                filtered_preds.append(predictions[i])
                filtered_comments.append(final_comments[i])

        return filtered_preds, filtered_comments

    except Exception as e:
        # If anything goes wrong, print error to stderr and exit
        print(json.dumps({"error": f"Python script error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

def main():
    try:
        # Read all data from stdin
        input_data = sys.stdin.read()
        
        # Debug: Show what we received
        print(f"DEBUG: Received {len(input_data)} characters", file=sys.stderr)
        
        comments = json.loads(input_data)
        
        print(f"DEBUG: Parsed {len(comments)} comments", file=sys.stderr)
        
        # Get model predictions + aligned comments (with threshold applied)
        predictions, valid_comments = analyze_comments(comments, threshold=0.7)

        # Process results
        anti_india_count = 0
        non_anti_india_count = 0
        anti_india_comments = []

        for i, pred in enumerate(predictions):
            if pred == 1:  # Assuming 1 is the "Anti-India" label
                anti_india_count += 1
                anti_india_comments.append(valid_comments[i])
            else:
                non_anti_india_count += 1
        
        # Final JSON output to stdout
        result = {
            "counts": {
                "anti_india": anti_india_count,
                "non_anti_india": non_anti_india_count,
                "total": len(valid_comments)
            },
            "anti_india_comments": anti_india_comments
        }
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON received: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"An unexpected error occurred in Python: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
