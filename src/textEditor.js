import {React,useCallback,useEffect, useRef, useState} from 'react'
import Quill from 'quill'
import {io} from "socket.io-client"
import { useParams } from 'react-router'
import { useSearchParams, useNavigate} from 'react-router-dom';
import axios from "axios";
import jspdf from "jspdf"; 

import "quill/dist/quill.snow.css"
import "./styles/textEditor.css"

const TOOLBAR_OPTIONS = [
    // array for drop-downs, empty array = defaults
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'size': [] }],
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline', 'strike'],  // toggled buttons
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
    ['image'],
]
const SAVE_INTERVAL_MS = 200
export default function TextEditor() {
    // const {documentId, setDocumentId} = useParams()
    const [socket,setSocket] = useState() 
    const [quill,setQuill] = useState() 
    const [email,setEmail] = useState() 
    const [isOpen, setIsOpen] = useState(false);
    const [accessList,setAccessList] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams()
    const [errorText,setErrorText] = useState("");

    const [store, setstore] = useState("");

    const nav = useNavigate();

    useEffect(() => {
        axios.defaults.headers.common['Authorization'] = localStorage.getItem('authToken');
        const data = { "did": searchParams.get("docId") };
        axios.post('/check_access', data)
        .then(response => {
            console.log(response);            
        })
        .catch(error => {
            nav('/home')
        });
    },[accessList])

    useEffect(() => {
        if(socket == null || quill == null) return 
        const interval = setInterval(()=> {
            socket.emit('save-document', quill.getContents())
        }, SAVE_INTERVAL_MS)
        return () =>{
            clearInterval(interval) 
        }        
    },[socket,quill])

    useEffect(()=>{
        // const reg = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
        // console.log(reg.test(searchParams.get('docId')));
        document.body.classList.add('text-editor-body');
    },[])

    useEffect(() => {
        if(socket == null || quill == null) return 
        socket.on('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })
        socket.emit('get-document',searchParams.get('docId'), localStorage.getItem('authToken'), searchParams.get('docName')) 
    },[socket,quill])

    useEffect(() => {
        const skt = io("ws://backend-service:3001")
        setSocket(skt);
        return () => {
            skt.disconnect();
        }
    },[])

    useEffect(() => {
        if(socket == null || quill == null) return 
        
        const handler = (delta,oldDelta,source) => {
            quill.updateContents(delta)
        }

        socket.on("receive-changes", handler)
        
        return () => {
            socket.off("receive-changes", handler)
        }
    }, [socket, quill])


    useEffect(() => {
        if(socket == null || quill == null) return 
        
        const handler = (delta,oldDelta,source) => {
            if(source != 'user') return
            socket.emit("send-changes", delta)
        }

        quill.on("text-change", handler)
        
        return () => {
            quill.off("text-change", handler)
        }
    }, [socket, quill])


    const wrapperRef = useCallback((wrapper)=>{
        if(wrapper == null) return
        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        const qll = new Quill(editor, {theme:"snow", modules : {toolbar : TOOLBAR_OPTIONS}})
        qll.disable()
        qll.setText("Loading...")
        

        setQuill(qll);
        const s = qll.getText();
        console.log("qll : ",s)
    },[])

    const togglePopup = async()=>{
        setIsOpen(!isOpen);
        if(isOpen) {
            await get_access_list();
        }
        else setErrorText("");
    }
    const get_access_list = () => {
        axios.defaults.headers.common['Authorization'] = localStorage.getItem('authToken');
        const data = { "did": searchParams.get("docId") };
        axios.post('/get_access_list', data)
        .then(response => {
            if(response.status == 200) setAccessList(response.data);
        })
        .catch(error => {
        });
    }

    const add_access_request = () => {
        axios.defaults.headers.common['Authorization'] = localStorage.getItem('authToken');
        const data = { "did": searchParams.get("docId"), "access_email": email };
        axios.post('/add_access', data)
        .then(response => {
            console.log(response);
          if(response.data==='Done')
            console.log(email, " can now access this document");
            setErrorText(email + " can now access this document");
            setAccessList(current => [... current, email])
        })
        .catch(error => {
            setErrorText("Please enter a valid email");
        });
    }

    const downloadPDF=()=>{
        const doc = new jspdf();
	
        // Source HTMLElement or a string containing HTML.
        const elementHTML = document.querySelector("#main-editor");
    
        doc.html(elementHTML, {
            callback: function(doc) {
                // Save the PDF                
                doc.save(searchParams.get('docName')+'.pdf');
            },
            margin: [10, 10, 10, 10],
            autoPaging: 'text',
            x: 0,
            y: 0,
            width: 190, //target width in the PDF document
            windowWidth: 675 //window width in CSS pixels
        });
        
    }

    const check_gramm =() =>{

        const stat = 0;
        socket.emit("check-grammar", stat);
        
        


    }
    

    return (
        <div> 
            <h1 className="home-logo" onClick={()=>nav('/home')}>DocuShare</h1>
            <div id = "main-editor" className="main-editor" ref={wrapperRef} value='asd '>
            </div>
            
            <div className='bottom-nav'>
                <button onClick={check_gramm} className="share-doc-btn">CheckVal</button>
                
                <button onClick={downloadPDF} className="share-doc-btn">Dowload document as PDF</button>
                <button onClick={togglePopup} className="share-doc-btn">Share Document</button> 
            </div>
            {isOpen && (
                <div className="share-popup">
                    <div className="share-popup-header">
                        <h3>Share document </h3>
                        <button className="share-popup-close-btn" onClick={togglePopup}>X</button>
                    </div>
                    <div className="share-popup-content">
                        <input type="email" placeholder='Add people (email)' onChange={(e) => setEmail(e.target.value)} required/>
                        <div>
                            {/* <button> Give read access </button> */}
                            <button onClick={add_access_request}> Give write access </button>
                        </div>
                    </div>
                    {errorText}
                    <h3>People who can access this document:</h3>
                    {
                        accessList.map(file => (
                        <div className="file"  key={file.id}>
                            
                            <div className="file-details">
                                <div className="">{file}</div>
                            </div>  
                        </div>
                        ))
                    }
                    {accessList.length > 1 ? 
                        
                     ""   :   <div className="access-list-none"> Only you have access to this document right now</div> 
                    }
                </div>
            )}
        </div>
        
    )
}
