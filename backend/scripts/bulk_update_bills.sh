#!/bin/bash

# ==============================================================================
# IT Inventory System - Bulk Bill Upload Script
# ==============================================================================
# Usage: ./bulk_update_bills.sh <directory_path> <auth_token>
#
# Filename convention: The script assumes files are named according to the 
# Asset Tag (e.g., ASSET123.pdf or ASSET123.jpg).
# ==============================================================================

# Configuration
API_URL="http://localhost:3001/api/assets/tag"

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <directory_path> <auth_token>"
    echo "Example: $0 ./my_bills eyJhbGciOiJIUzI1..."
    exit 1
fi

BILLS_DIR=$1
TOKEN=$2

# Check if directory exists
if [ ! -d "$BILLS_DIR" ]; then
    echo "Error: Directory $BILLS_DIR does not exist."
    exit 1
fi

echo "Starting bulk upload from $BILLS_DIR..."
echo "--------------------------------------------------"

# Iterate through files
# Supports .pdf, .jpg, .jpeg, .png (case insensitive)
count=0
success=0
failed=0

for file in "$BILLS_DIR"/*; do
    # Check if it's a file
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        extension="${filename##*.}"
        tag="${filename%.*}"
        
        # Check if extension is allowed
        case "${extension,,}" in
            pdf|jpg|jpeg|png)
                echo -n "Uploading $filename for asset tag [$tag]... "
                
                # Perform the upload
                response=$(curl -s -X POST \
                    -H "Authorization: Bearer $TOKEN" \
                    -F "bill=@$file" \
                    "$API_URL/$tag/bill")
                
                # Check response for success
                if [[ $response == *"\"success\":true"* ]]; then
                    echo "SUCCESS"
                    ((success++))
                else
                    echo "FAILED"
                    echo "   Reason: $response"
                    ((failed++))
                fi
                ((count++))
                ;;
            *)
                # Skip other files
                ;;
        esac
    fi
done

echo "--------------------------------------------------"
echo "Batch process complete!"
echo "Total files processed: $count"
echo "Successful uploads: $success"
echo "Failed uploads: $failed"
