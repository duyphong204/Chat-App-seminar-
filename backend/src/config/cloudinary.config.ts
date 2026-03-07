import {v2 as cloudinary} from "cloudinary"
import { Env } from "./env.config"

cloudinary.config({
    cloud_name : Env.CLOUDINARY_CLOUD_NAME,
    api_secret : Env.CLOUDINARY_API_SECRET,
    api_key : Env.CLOUDINARY_API_KEY
})
export default cloudinary