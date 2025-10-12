import User from '../models/user.models.js';

 const addUser = async ({ username, email, password, role = 'user' }) => {
    // role is defaulted to 'user' here, so no need for validation on this field
    const user = await User.create({
        username,
        email,
        password, // The password should already be hashed by the controller
        role,
    });
    return user;
};

 const allUser=async(req,res)=>{
    try{
        const users=await User.find();
        res.status(200).json(users)
    }catch(err){
        res.status(400).json({error:err.message})
    }
}
 const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export default {allUser,addUser,getUserByEmail}
