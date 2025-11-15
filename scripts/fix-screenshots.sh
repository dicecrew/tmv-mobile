#!/bin/bash

# Script para redimensionar screenshots a las dimensiones exactas requeridas por Apple
# Dimensiones requeridas:
# - 1242 × 2688px (portrait)
# - 1284 × 2778px (portrait)

set -e

OUTPUT_DIR="screenshots"
FIXED_DIR="screenshots/fixed"
mkdir -p "$FIXED_DIR"

echo "🔧 Redimensionador de Screenshots para App Store"
echo ""
echo "Este script redimensionará screenshots a las dimensiones exactas requeridas:"
echo "  - 1242 × 2688px (portrait)"
echo "  - 1284 × 2778px (portrait)"
echo ""

# Verificar si sips está disponible
if ! command -v sips &> /dev/null; then
  echo "❌ Error: sips no está disponible. Este script requiere macOS."
  exit 1
fi

# Buscar archivos PNG en la carpeta screenshots (excluyendo la carpeta fixed)
# Usar un array para almacenar los archivos
declare -a SCREENSHOTS_ARRAY=()

# Usar find con -print0 para manejar espacios en nombres de archivos
while IFS= read -r -d '' file; do
  # Excluir archivos en la carpeta fixed
  if [[ "$file" != *"/fixed/"* ]] && [ -f "$file" ]; then
    SCREENSHOTS_ARRAY+=("$file")
  fi
done < <(find "$OUTPUT_DIR" -maxdepth 1 -name "*.png" -type f -print0 2>/dev/null)

if [ ${#SCREENSHOTS_ARRAY[@]} -eq 0 ]; then
  echo "⚠️  No se encontraron screenshots en $OUTPUT_DIR"
  echo ""
  echo "Para generar screenshots:"
  echo "  1. Abre la app en el simulador"
  echo "  2. Presiona Cmd+S en el simulador para tomar screenshot"
  echo "  3. Mueve el screenshot a la carpeta $OUTPUT_DIR"
  exit 1
fi

echo "📸 Screenshots encontrados:"
for file in "${SCREENSHOTS_ARRAY[@]}"; do
  basename "$file"
done
echo ""

# Dimensiones requeridas
declare -a SIZES=(
  "1242x2688"
  "1284x2778"
)

# Procesar cada archivo
PROCESSED_COUNT=0
for file in "${SCREENSHOTS_ARRAY[@]}"; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  filename=$(basename "$file")
  name_without_ext="${filename%.png}"
  
  echo "🔄 Procesando: $filename"
  
  # Obtener dimensiones actuales
  CURRENT_WIDTH=$(sips -g pixelWidth "$file" 2>/dev/null | tail -1 | awk '{print $2}')
  CURRENT_HEIGHT=$(sips -g pixelHeight "$file" 2>/dev/null | tail -1 | awk '{print $2}')
  
  if [ -z "$CURRENT_WIDTH" ] || [ -z "$CURRENT_HEIGHT" ]; then
    echo "   ⚠️  No se pudieron obtener las dimensiones, saltando..."
    continue
  fi
  
  echo "   Dimensiones actuales: ${CURRENT_WIDTH}x${CURRENT_HEIGHT}"
  
  # Redimensionar a cada tamaño requerido
  for size in "${SIZES[@]}"; do
    WIDTH="${size%x*}"
    HEIGHT="${size#*x}"
    
    # Limpiar el nombre del archivo para evitar caracteres problemáticos
    SAFE_NAME=$(echo "$name_without_ext" | sed 's/[^a-zA-Z0-9_-]/_/g')
    OUTPUT_FILE="$FIXED_DIR/${SAFE_NAME}_${WIDTH}x${HEIGHT}.png"
    
    echo "   → Redimensionando a ${WIDTH}x${HEIGHT}..."
    
    # Redimensionar manteniendo aspecto
    if sips -z "$HEIGHT" "$WIDTH" "$file" --out "$OUTPUT_FILE" 2>/dev/null; then
      # Verificar dimensiones finales
      FINAL_WIDTH=$(sips -g pixelWidth "$OUTPUT_FILE" 2>/dev/null | tail -1 | awk '{print $2}')
      FINAL_HEIGHT=$(sips -g pixelHeight "$OUTPUT_FILE" 2>/dev/null | tail -1 | awk '{print $2}')
      
      if [ "$FINAL_WIDTH" = "$WIDTH" ] && [ "$FINAL_HEIGHT" = "$HEIGHT" ]; then
        echo "   ✅ Guardado: $(basename "$OUTPUT_FILE")"
        PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
      else
        echo "   ⚠️  Dimensiones finales: ${FINAL_WIDTH}x${FINAL_HEIGHT} (esperado: ${WIDTH}x${HEIGHT})"
      fi
    else
      echo "   ❌ Error al redimensionar a ${WIDTH}x${HEIGHT}"
    fi
  done
  echo ""
done

echo "✅ Screenshots redimensionados guardados en: $FIXED_DIR"
echo "📊 Total procesado: ${PROCESSED_COUNT} archivos generados"
echo ""

if [ "$PROCESSED_COUNT" -gt 0 ]; then
  echo "📋 Archivos generados:"
  ls -lh "$FIXED_DIR"/*.png 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
fi

echo ""
echo "💡 Próximos pasos:"
echo "  1. Revisa los screenshots en $FIXED_DIR"
echo "  2. Sube los archivos con dimensiones exactas a App Store Connect"
echo "  3. Dimensiones requeridas:"
echo "     - 1242 × 2688px (portrait)"
echo "     - 1284 × 2778px (portrait)"
