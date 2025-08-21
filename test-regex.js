const text = `1. **Blue Tokai Coffee Roasters**
   - **Category:** Fast Food, Restaurant
   - **Address:** Sadar Bazar Road, Jacobpura, Sector 12, Gurugram 122001, Haryana
   - **Coordinates:** 28.459557, 77.026578

2. **Barbeque Nation**
   - **Category:** Barbecue, Restaurant
   - **Address:** Sadar Bazar Road, Roshanpura, Gurugram 122001, Haryana
   - **Coordinates:** 28.45939, 77.02657`;

const coordinateRegex = /-\s*\*\*Coordinates:\*\*\s*([\d.-]+),\s*([\d.-]+)/g;
const nameRegex = /\d+\.\s*\*\*(.*?)\*\*/g;

console.log("Testing coordinate regex...");
let match;
while ((match = coordinateRegex.exec(text)) !== null) {
  console.log("Found coordinates:", match[1], match[2]);
}

console.log("Testing name regex...");
coordinateRegex.lastIndex = 0;
nameRegex.lastIndex = 0;
while ((match = nameRegex.exec(text)) !== null) {
  console.log("Found name:", match[1]);
}
