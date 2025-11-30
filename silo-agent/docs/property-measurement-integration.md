# Property Measurement Integration Guide

Automatically estimate lawn size from customer address using satellite/mapping APIs.

## 🎯 **Why This Matters**

Instead of asking customers to guess their lawn size:
- **Before**: "Is your lawn small, medium, or large?" → Inaccurate guesses
- **After**: "What's your address?" → Automatic measurement → Accurate estimates

## 🛰️ **Integration Options**

### **Option 1: Google Maps Geocoding (Easiest - MVP)**

**What it does**: Converts address → coordinates, estimates property size  
**Accuracy**: Rough estimates (~60-70% confidence)  
**Cost**: $5 per 1,000 requests (generous free tier)

**Setup**:
1. Get API key: https://console.cloud.google.com/apis/credentials
2. Enable: Geocoding API
3. Add to Replit Secrets: `GOOGLE_MAPS_API_KEY`

**Code**: Already implemented in `server/services/propertyMeasurement.ts`

```typescript
import { estimatePropertySize } from './services/propertyMeasurement';

const result = await estimatePropertySize("123 Main St, Austin, TX");
// Returns: { estimatedSquareFeet: 8000, lawnSizeCategory: "Medium (5,000-10,000 sq ft)", confidence: 0.6 }
```

---

### **Option 2: Google Earth Engine (Most Accurate)**

**What it does**: Satellite imagery analysis → precise property boundaries  
**Accuracy**: 95%+ with ML footprint detection  
**Cost**: Free for non-commercial use

**Setup**:
1. Create account: https://earthengine.google.com/
2. Get service account credentials
3. Install: `npm install @google/earthengine`

**Use Case**: Production apps needing exact measurements

**Python Example**:
```python
import ee
ee.Initialize()

# Define property boundary polygon
geometry = ee.Geometry.Polygon([[
  [-122.084, 37.422],
  [-122.083, 37.422],
  [-122.083, 37.421],
  [-122.084, 37.421]
]])

area = geometry.area()  # Square meters
print(f"Lawn area: {area.getInfo() * 10.764} sq ft")
```

---

### **Option 3: Mapbox Satellite API**

**What it does**: High-resolution aerial imagery + measurement tools  
**Accuracy**: Very high (Nearmap: 25cm resolution for US urban areas)  
**Cost**: Free tier, then pay-per-request

**Setup**:
1. Get token: https://account.mapbox.com/
2. Add to secrets: `MAPBOX_ACCESS_TOKEN`
3. Use Mapbox GL JS for visual measurement

**Frontend Integration**:
```javascript
mapboxgl.accessToken = 'YOUR_TOKEN';
const map = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [lng, lat],
  zoom: 18
});

// Add measurement tools
const draw = new MapboxDraw();
map.addControl(draw);
```

---

### **Option 4: County Assessor APIs (Pre-calculated)**

**What it does**: Access official property records with lot sizes  
**Accuracy**: 100% (official records)  
**Cost**: Free or low-cost per lookup

**Examples**:
- **Texas**: https://tax-office.traviscountytx.gov/ (API available)
- **California**: https://www.lacountyassessor.com/ (bulk data)
- **PARLAY 2.0** (nationwide): 160M+ properties ($99/quarter)

**Use Case**: US residential properties where accuracy is critical

---

## 🔧 **Implementation Roadmap**

### **Phase 1: Address Collection (Current)**
✅ Added address question to Landscaping → Lawn Maintenance  
✅ Created `propertyMeasurement.ts` service

### **Phase 2: Basic Geocoding (Next)**
1. Set `GOOGLE_MAPS_API_KEY` in Replit Secrets
2. Update `server/routes/session.ts` to call `estimatePropertySize()`
3. Auto-fill lawn size question if address provided

### **Phase 3: Satellite Measurement (Advanced)**
1. Integrate Google Earth Engine or Mapbox
2. Train ML model for building footprint detection
3. Calculate: Lot size - Building - Hardscape = Lawn area

---

## 📊 **Workflow Example**

**With Address Auto-Measurement**:
```
User: "I need lawn mowing"
System: "What's your property address?"
User: "123 Oak Street, Austin, TX 78701"

[Background: API call → geocode → estimate → 12,500 sq ft → "Large" category]

System: "Based on your address, we estimate a Large lawn (10,000-20,000 sq ft). Is this correct?"
User: "Yes"
System: "Any obstacles? (trees, flower beds, etc.)"
...
Final estimate: 3.5 hours (accurate!)
```

**Without Address** (current fallback):
```
User: "grass cut"
System: "What size is your lawn?"
User: "Maybe medium?" (guesses wrong)
...
Final estimate: 2 hours (inaccurate - it's actually large!)
```

---

## 🚀 **Quick Start: Enable Google Maps**

1. **Get API Key**:
   ```bash
   # Visit: https://console.cloud.google.com/apis/credentials
   # Create project → Enable Geocoding API → Create credentials
   ```

2. **Add to Replit**:
   - Go to Secrets (🔒 icon in sidebar)
   - Add: `GOOGLE_MAPS_API_KEY` = `your_key_here`

3. **Restart Workflow**:
   ```bash
   # Workflow will auto-restart, or manually restart
   ```

4. **Test**:
   ```bash
   # Try "grass cut" → enter address → see auto-estimated size
   ```

---

## 💰 **Cost Comparison**

| **Service** | **Free Tier** | **Paid** | **Accuracy** |
|-------------|---------------|----------|--------------|
| Google Maps Geocoding | $200/month credit | $5 per 1K | 60-70% |
| Google Earth Engine | Unlimited (non-commercial) | Contact sales | 95%+ |
| Mapbox Satellite | 50K requests/month | $0.50 per 1K | 90%+ |
| County Assessor | Varies by county | Free - $50/month | 100% |

---

## 🎓 **References**

- [Google Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Google Earth Engine API](https://developers.google.com/earth-engine/apidocs)
- [Mapbox Satellite Imagery](https://www.mapbox.com/imagery)
- [Building Footprint Detection Tutorial](https://medium.com/@skavinskyy/how-you-can-calculate-building-footprint-sqft-with-satellite-image-recognition-18e206302c7e)

---

## ✅ **Next Steps**

1. Enable Google Maps API (5 minutes)
2. Test address-based estimation
3. Measure impact on estimate accuracy
4. Consider upgrading to satellite measurement for production

The system is already set up to use address data - just add your API key to unlock automatic property measurement!
