/**
* Template Name: NiceAdmin
* Template URL: https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/
* Updated: Apr 20 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach(e => e.addEventListener(type, listener))
    } else {
      select(el, all).addEventListener(type, listener)
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Sidebar toggle
   */
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function(e) {
      select('body').classList.toggle('toggle-sidebar')
    })
  }

  /**
   * Search bar toggle
   */
  if (select('.search-bar-toggle')) {
    on('click', '.search-bar-toggle', function(e) {
      select('.search-bar').classList.toggle('search-bar-show')
    })
  }


  const elMsg   = document.getElementById("result-message");
  const elFloat = document.getElementById("tbl-float");
  const elOff   = document.getElementById("tbl-offerings");
  const elWick  = document.getElementById("tbl-wick");
  const elGap   = document.getElementById("tbl-gap");

  // --- helpers ---
  function parsePayload(apiResp) {
    // Your backend returns: { body: "<big json string>" }
    const body = apiResp?.body;
    if (typeof body === "string") return JSON.parse(body);
    if (typeof body === "object") return body;
    return apiResp; // fallback
  }

  function columnarToRows(columnar, { idKey = "row_id" } = {}) {
    const cols = Object.keys(columnar || {});
    const ids = new Set();
    cols.forEach(c => Object.keys(columnar[c] || {}).forEach(id => ids.add(id)));
    const sorted = [...ids].sort((a,b) =>
      (isFinite(+a) && isFinite(+b)) ? (+a - +b) : (a > b ? 1 : -1)
    );
    return sorted.map(id => {
      const row = { [idKey]: id };
      cols.forEach(c => row[c] = columnar[c]?.[id] ?? null);
      return row;
    });
  }

  function renderTable(el, rows, columns) {
    if (!el) return;
    if (!rows?.length) {
      el.innerHTML = "<thead><tr><th>—</th></tr></thead><tbody><tr><td>No data</td></tr></tbody>";
      return;
    }
    const safe = v => (v ?? "") + "";
    const fmtNum = v => (typeof v === "number"
      ? v.toLocaleString(undefined, { maximumFractionDigits: Number.isInteger(v) ? 0 : 6 })
      : safe(v)
    );

    const thead = `<thead><tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${
      rows.map(r => `<tr>${columns.map(c => `<td>${fmtNum(r[c])}</td>`).join("")}</tr>`).join("")
    }</tbody>`;
    el.innerHTML = thead + tbody;
  }

  function renderAll(data) {
    // Header/message
    elMsg.textContent = data?.message || "";

    // Float data is already row-like ({"0": {source, float}, ...})
    const floatRows = Object.values(data?.float_data || {});
    renderTable(elFloat, floatRows.map(r => ({ Source: r.source, Float: r.float })), ["Source", "Float"]);

    // Offerings are columnar → rows
    // const offRows = columnarToRows(data?.offerings || {}, { idKey: "row" }).map(r => ({
    //   filingDate: r.filingDate, form: r.form, accessionNumber: r.accessionNumber,
    //   fileNumber: r.fileNumber, primaryDocument: r.primaryDocument,
    //   primaryDocDescription: r.primaryDocDescription, size: Number(r.size) || null,
    //   isXBRL: !!Number(r.isXBRL), isInlineXBRL: !!Number(r.isInlineXBRL),
    //   acceptanceDateTime: r.acceptanceDateTime, reportDate: r.reportDate,
    //   act: r.act, filmNumber: r.filmNumber, items: r.items, core_type: r.core_type
    // }));
   
    // ---- Offerings (columnar → rows) with selected/renamed columns
    function formatDateOnly(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      return isNaN(d) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }

    const offSrc = columnarToRows(data?.offerings || {}, { idKey: "row" });

    // sort newest first by raw ISO filingDate (before formatting)
    offSrc.sort((a, b) => (b.filingDate || "").localeCompare(a.filingDate || ""));

    // map to display keys in the exact order/labels you want
    const offeringRows = offSrc.map(r => ({
      "Filing Date": r.filingDate || "",
      "Form Type": r.form || "",
      "Accession Number": r.accessionNumber || "",
      "File Number": r.fileNumber || "",
      "Primary Document": r.primaryDocument || "",
      "Description": r.primaryDocDescription || "",
      "Acceptance Date": formatDateOnly(r.acceptanceDateTime),
      "Report Date": r.reportDate || ""
    }));

    const offeringCols = [
      "Filing Date",
      "Form Type",
      "Accession Number",
      "File Number",
      "Primary Document",
      "Description",
      "Acceptance Date",
      "Report Date"
    ];

    renderTable(document.getElementById("tbl-offerings"), offeringRows, offeringCols);

    // Wick days (columnar by timestamp) → rows, prefer provided Date
    const wickRaw = columnarToRows(data?.wick_days || {}, { idKey: "ts" });
    const wickRows = wickRaw.map(r => ({
      Date: r["Date"] || r.ts,
      Open: r["Open"], High: r["High"], Low: r["Low"], Close: r["Close"],
      Volume: r["Volume"], Color: r["Color"],
      Type: r["Types"], Price_of_Interest: r["Price_of_Interest"],
      Dividends: r["Dividends"], Stock_Splits: r["Stock Splits"]
    })).sort((a,b) => (a.Date > b.Date ? 1 : -1));
    renderTable(
      elWick,
      wickRows,
      ["Date","Open","High","Low","Close","Volume","Color","Type","Price_of_Interest","Dividends","Stock_Splits"]
    );

    // Gap days (columnar) → rows
    const gapRows = columnarToRows(data?.gap_days || {}, { idKey: "row" }).map(r => ({
      start_date: r.start_date, end_date: r.end_date, type: r.type,
      color: r.color, price_gap: r.price_gap, retracement_price: r.retracement_price
    }));
    renderTable(elGap, gapRows, ["start_date","end_date","type","color","price_gap","retracement_price"]);
  }



  /**
   * Search Functionality
   */
 const ticker = document.getElementById("ticker")
 const form = document.getElementById("ticker_value")

 form.addEventListener("submit", async (e) => {
    e.preventDefault()
    let headers = new Headers()

    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')  
    //headers.append('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token')
    headers.append('OPTIONS', 'POST')
    let searchInput = document.getElementById("ticker_search").value
    let url = "https://zk23ibi8il.execute-api.us-east-1.amazonaws.com/DEV/?ticker=" + searchInput

    try{

      const response = await fetch(url, {
        headers: headers, 
        method: 'POST'
      });    
      ticker.textContent = searchInput
      console.log("Hello! ", searchInput)

      if (!response.ok) 
        throw new Error('HTTP ${response.status}')
      
      let resp = await response.json()
      const data = parsePayload(resp); // handles the { body: "<json>" } shape
      renderAll(data);
    }
    catch(err){
      console.error(err)
    }

  }
 )

// HERE IS A CLEAN FIRST TRY VERSION OF CODE
//  form.addEventListener("submit", function(e){
//     e.preventDefault()
//     let headers = new Headers()

//     headers.append('Content-Type', 'application/json')
//     headers.append('Accept', 'application/json')  
//     //headers.append('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token')
//     headers.append('OPTIONS', 'POST')
//     let searchInput = document.getElementById("ticker_search").value
//     let url = "https://zk23ibi8il.execute-api.us-east-1.amazonaws.com/DEV/?ticker=" + searchInput

//     const response = await fetch(url, {
//       headers: headers, 
//       method: 'POST'
//     });    
//     ticker.textContent = searchInput
//     console.log("Hello! ", searchInput)
//   }
//  )
// END OF CLEAN FIRST TRY VERSION


//  form.addEventListener("submit", function(e){
//     e.preventDefault()
//     let headers = new Headers()

//     headers.append('Content-Type', 'application/json')
//     headers.append('Accept', 'application/json')  
//     //headers.append('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token')
//     headers.append('OPTIONS', 'POST')
//     let searchInput = document.getElementById("ticker_search").value
//     let url = "https://zk23ibi8il.execute-api.us-east-1.amazonaws.com/DEV/?ticker=" + searchInput

//     fetch(url, {
//       headers: headers, 
//       method: 'POST'
//     }).then(response => response.json())
//     .then(data => {
//       let body = JSON.parse(data['body'])
//       let float_data = body['float_data']
//       let offerings = body['offerings']
//       let wick_days = JSON.stringify(body['wick_days'])
//       let gap_days = body['gap_days']


//       let wd_json = JSON.parse(wick_days)
//       console.log(float_data)
//       console.log(offerings)
//       console.log(wd_json)
//       console.log(gap_days)

//       let table = document.getElementById('wick_days')

//       for(var key in wd_json){
//         if(wd_json.hasOwnProperty(key)){
//           console.log(wd_json[key])
//         }
//       }

//       for(let i = 0; i < Object.keys(wd_json).length; ++i){
//         for(var key in wd_json[i]){
//           console.log(wd_json(key))
//         }

//         let row = `<tr> 
//                         <td>${wd_json[i]}</td>
//                    </tr>`
//         table.innerHTML += row
//       }
//     })

//     ticker.textContent = searchInput
//     console.log("Hello! ", searchInput)
//  });


  /**
   * Search Functionality
   */
 const ticker = document.getElementById("ticker")
 const form = document.getElementById("ticker_value")

 form.addEventListener("submit", function(e){
    e.preventDefault()
    let headers = new Headers()

    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')  
    //headers.append('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token')
    headers.append('OPTIONS', 'POST')
    let searchInput = document.getElementById("ticker_search").value
    let url = "https://zk23ibi8il.execute-api.us-east-1.amazonaws.com/DEV/?ticker=" + searchInput

    fetch(url, {
      headers: headers, 
      method: 'POST'
    }).then(data => {
          console.log(data)
    })

    ticker.textContent = searchInput
    console.log("Hello! ", searchInput)
 });

` input.addEventListener("ticker_search", getInput);
`
//  function getInput(e) {
//   // let ticker_value = document.getElementById("ticker_search").value;
//   // let url = "https://zk23ibi8il.execute-api.us-east-1.amazonaws.com/DEV/?ticker=" + ticker_value;
  
//   // fetch(url).then(data => {
//   //   console.log(data)
//   // });
//   e.preventDefault();
//   window.location = "http://www.google.com/search/" + input.value;
//   val.textContent = e.target.value;
//   //console.log("Ticker searched!");
//  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Initiate tooltips
   */
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })

  /**
   * Initiate quill editors
   */
  if (select('.quill-editor-default')) {
    new Quill('.quill-editor-default', {
      theme: 'snow'
    });
  }

  if (select('.quill-editor-bubble')) {
    new Quill('.quill-editor-bubble', {
      theme: 'bubble'
    });
  }

  if (select('.quill-editor-full')) {
    new Quill(".quill-editor-full", {
      modules: {
        toolbar: [
          [{
            font: []
          }, {
            size: []
          }],
          ["bold", "italic", "underline", "strike"],
          [{
              color: []
            },
            {
              background: []
            }
          ],
          [{
              script: "super"
            },
            {
              script: "sub"
            }
          ],
          [{
              list: "ordered"
            },
            {
              list: "bullet"
            },
            {
              indent: "-1"
            },
            {
              indent: "+1"
            }
          ],
          ["direction", {
            align: []
          }],
          ["link", "image", "video"],
          ["clean"]
        ]
      },
      theme: "snow"
    });
  }

  /**
   * Initiate TinyMCE Editor
   */

  const useDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 1023.5px)').matches;

  tinymce.init({
    selector: 'textarea.tinymce-editor',
    plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
    editimage_cors_hosts: ['picsum.photos'],
    menubar: 'file edit view insert format tools table help',
    toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl",
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: '{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    link_list: [{
        title: 'My page 1',
        value: 'https://www.tiny.cloud'
      },
      {
        title: 'My page 2',
        value: 'http://www.moxiecode.com'
      }
    ],
    image_list: [{
        title: 'My page 1',
        value: 'https://www.tiny.cloud'
      },
      {
        title: 'My page 2',
        value: 'http://www.moxiecode.com'
      }
    ],
    image_class_list: [{
        title: 'None',
        value: ''
      },
      {
        title: 'Some class',
        value: 'class-name'
      }
    ],
    importcss_append: true,
    file_picker_callback: (callback, value, meta) => {
      /* Provide file and text for the link dialog */
      if (meta.filetype === 'file') {
        callback('https://www.google.com/logos/google.jpg', {
          text: 'My text'
        });
      }

      /* Provide image and alt text for the image dialog */
      if (meta.filetype === 'image') {
        callback('https://www.google.com/logos/google.jpg', {
          alt: 'My alt text'
        });
      }

      /* Provide alternative source and posted for the media dialog */
      if (meta.filetype === 'media') {
        callback('movie.mp4', {
          source2: 'alt.ogg',
          poster: 'https://www.google.com/logos/google.jpg'
        });
      }
    },
    height: 600,
    image_caption: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    noneditable_class: 'mceNonEditable',
    toolbar_mode: 'sliding',
    contextmenu: 'link image table',
    skin: useDarkMode ? 'oxide-dark' : 'oxide',
    content_css: useDarkMode ? 'dark' : 'default',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
  });

  /**
   * Initiate Bootstrap validation check
   */
  var needsValidation = document.querySelectorAll('.needs-validation')

  Array.prototype.slice.call(needsValidation)
    .forEach(function(form) {
      form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }

        form.classList.add('was-validated')
      }, false)
    })

  /**
   * Initiate Datatables
   */
  const datatables = select('.datatable', true)
  datatables.forEach(datatable => {
    new simpleDatatables.DataTable(datatable, {
      perPageSelect: [5, 10, 15, ["All", -1]],
      columns: [{
          select: 2,
          sortSequence: ["desc", "asc"]
        },
        {
          select: 3,
          sortSequence: ["desc"]
        },
        {
          select: 4,
          cellClass: "green",
          headerClass: "red"
        }
      ]
    });
  })

  /**
   * Autoresize echart charts
   */
  const mainContainer = select('#main');
  if (mainContainer) {
    setTimeout(() => {
      new ResizeObserver(function() {
        select('.echart', true).forEach(getEchart => {
          echarts.getInstanceByDom(getEchart).resize();
        })
      }).observe(mainContainer);
    }, 200);
  }

})();