const fs = require('fs');
const path = require('path');
const axios = require('axios');

const imagesToDownload = [
    {
        name: 'ethiopian_farmer.png',
        // High quality photo of a real smallholder farmer in a sunny agricultural field
        url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&h=600&q=80'
    },
    {
        name: 'coffee_crop.png',
        // Beautiful close up of ripening red coffee berries in an agricultural farm
        url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&h=600&q=80'
    },
    {
        name: 'ethiopian_crops.png',
        // High quality photo of golden teff / grains field and agricultural harvest
        url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&h=600&q=80'
    }
];

const targetDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImages() {
    console.log('Starting download of premium agricultural showcase images...');
    
    for (const image of imagesToDownload) {
        const destPath = path.join(targetDir, image.name);
        console.log(`Downloading ${image.name} from Unsplash Stock API...`);
        
        try {
            const response = await axios({
                method: 'GET',
                url: image.url,
                responseType: 'stream'
            });
            
            const writer = fs.createWriteStream(destPath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            console.log(`Successfully saved ${image.name} to local public images folder.`);
        } catch (error) {
            console.error(`Failed to download ${image.name}:`, error.message);
        }
    }
    
    console.log('Image download process complete.');
}

downloadImages();
