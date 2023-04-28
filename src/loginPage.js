import React, { useEffect, useState } from 'react'
import "./styles/loginPage.css"
import axios from "axios"
import { useNavigate } from 'react-router-dom';


export default function LoginPage({onLogin}) {
    useEffect(()=>{
        document.body.classList.add('login-body');
    })

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const nav = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      const data = { email, password };
      let axiosConfig = {
          headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          "Access-Control-Allow-Origin": true,
          "Access-Control-Allow-Credentials": true,
        }
      }
      console.log("Updated!");
      axios.post('http://20.127.252.24:3002/login', data, axiosConfig)
      .then(response => {
        console.log(response.data.token);
        onLogin(response.data.token);
        nav('/home')
      })
      .catch(error => {
        console.log(error);
      });
    };
    return (
      <div>
        <nav className="login-top-nav-bar">
          <ul>
              <li><a href="/home">DocuShare</a></li>
          </ul>
        </nav>
        <div className="login-center">
          <h1>Login</h1>
          <form onSubmit={handleSubmit} method="post">
            <div className="txt_field">
              <input type="text" onChange={(e) => setEmail(e.target.value)} required/>
              <span></span>
              <label>Gmail</label>
            </div>
            <div className="txt_field">
              <input type="password" onChange={(e) => setPassword(e.target.value)} required/>
              <span></span>
              <label>Password</label>
            </div>
            {/* <div className="pass">Forgot Password?</div> */}
            <input type="submit" value="Login"/>
            <div className="signup_link">
              Not a Member? <a href="/register">Signup</a>
            </div>
          </form>
        </div>
      </div>
    );
}

//     <div className="login-center">
//       <h1>Login</h1>
//       <form method="post">
//         <div className="txt_field">
//           <input type="text" required>
//           <span></span>
//           <label>Username</label>
//         </div>
//         <div className="txt_field">
//           <input type="password" required>
//           <span></span>
//           <label>Password</label>
//         </div>
//         <div className="pass">Forgot Password?</div>
//         <input type="submit" value="Login">
//         <div className="signup_link">
//           Not a member? <a href="#">Signup</a>
//         </div>
//       </form>
//     </div>

