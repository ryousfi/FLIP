const URL_BASE = 'https://my-app.cawbh.whs-at49357-dev-cx-b2e-nch.azpriv-cloud.ubs.net/api';
//const URL_BASE = 'https://10.200.196.108:8080';
const GENERATE_KEYS_ENDPOINT = URL_BASE + '/generate-translation-keys-for-review/';
const CREATE_MR_ENDPOINT = URL_BASE + '/create-merge-request/';
const GET_FOLDERS_ENDPOINT = URL_BASE + '/load-repo-packages/';

// Show the initial UI without text messages
console.log('FLIP - Init the plugin UI ...');
figma.showUI(__html__, {
  width: 900,
  height: 800
});



const getPathToNode = (node) => {
  let subpaths = []
  while (node !== figma.root) {
    node = node.parent
    subpaths.push(node.name);
  }

  const path = subpaths.reverse().reduce(
    (accumulator, currentValue) => accumulator === '' ?
      currentValue
      :
      accumulator + ':' + currentValue,

    '',
  );
  return path;
}

function traverse(node: any, subpath: string, messages: any[]) {

  let path;
  subpath ?
    path = subpath + ':' + node.name
    :
    path = node.name;

  if (node.type === "TEXT") {
    messages.push({
      text: node.characters,
      path: path
    });
  }


  if ("children" in node) {

    for (const child of node.children) {
      traverse(child, path, messages)
    }
  }
}


// Extract all text messages and send a notification to figna UI
console.log('FLIP - Extracting text messages ...');
(async () => {
  let messages: any[] = [];
  let mode: string;
  await figma.loadAllPagesAsync();

  if (figma.currentPage.selection.length > 0) {
    mode = 'selection';
    messages = []

    // Use only on the selected nodes
    for (const node of figma.currentPage.selection) {
      traverse(node, getPathToNode(node), messages);
    }
  } else {
    // Use all nodes
    messages = [];
    mode = 'full';
    traverse(figma.root, '', messages);
  }

  // Detect the default language
  console.log('FLIP - Getting the default language [TODO] ...');
  // TODO


  // Beautify text messages the default language
  console.log('FLIP - Beautifying messages [TODO] ...');
  // TODO

  // Render text messages
  console.log('FLIP - Render text messages ...');
  setTimeout(() => {
    figma.ui.postMessage({ type: 'messages', mode: mode, data: messages });
  }, 0);

  // Get folders
  // GET_FOLDERS API **************************************************
  const requestParams = {
    target_repository: 'itt'
  };

  console.log(JSON.stringify(requestParams));

  
       (async () => {
   
         try {
           const data = await fetchWithErrorHandling(GET_FOLDERS_ENDPOINT,
             {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json'
               },
               body: JSON.stringify(
                   requestParams
               ),
             });
            data?.packages.sort();
            data?.terminologies.sort();
           figma.ui.postMessage({ type: 'folder_list', code: 'success', data: data });
         } catch (error) {
           console.log('FLIP - Error occured while getting repository folders: ' + (error as Error).message);
           figma.ui.postMessage({ type: 'folder_list', code: 'failure', data: (error as Error).message });
         }
       })();
 

/*
  setTimeout(() => {
    const dataItt = {
      packages: [
        'itt - package 3', 'itt - package 1', 'itt - package 2'
      ],
      terminologies: [
        'itt - terminology 3', 'itt - terminology 1', 'itt - terminology 2'
      ],
    };

    // order packages and terminologies by name
    dataItt.packages.sort();
    dataItt.terminologies.sort();
    console.log('Sending back folders: ' + JSON.stringify(dataItt));
    figma.ui.postMessage({ type: 'folder_list', code: 'success', data: dataItt });
  }, 4000)
*/

})()

// on messages from figma UI (send, generate codeor cancel)
figma.ui.onmessage = (msg: { type: string, data: any }) => {
  if (msg.type === 'send') {
    console.log('FLIP - Generating keys ...');
    // GENERATE_KEYS API **************************************************
    const requestParams: any = {
      target_repo: 'itt',
      package: msg.data.package,
      terminology: msg.data.terminology,
      generate_accessibility_properties: msg.data.generateAccessibility,
      texts: msg.data.textMessages
    }

    console.log(JSON.stringify(requestParams));
     
          (async () => {
            try {
              const data = await fetchWithErrorHandling(GENERATE_KEYS_ENDPOINT,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
      
                  },
                  body: JSON.stringify(
                    requestParams
                  ),
                });
              figma.ui.postMessage({ type: 'translation', code: 'success', data: data.translations });
            } catch (error) {
              console.log('FLIP - Error occured while generating translation keys for the selected messages: ' + (error as Error).message);
              figma.ui.postMessage({ type: 'translation', code: 'failure', data: (error as Error).message });
            }
          })();
  
/*
    setTimeout(() => {
      const list = {
        translations: [
          {
            translation: {
              key: 'translation_key0',
              value: 'translation_val0'
            },
            accessibility_label: {
              key: 'acc_label_key0',
              value: 'acc_label_val0'
            },
            accessibility_hint: {
              key: 'acc_hint_key0',
              value: 'acc_hint_key0'
            },
          },
          {
            translation: {
              key: 'translation_key1',
              value: 'translation_val1'
            },
            accessibility_label: {
              key: 'acc_label_key1',
              value: 'acc_label_val1'
            },
            accessibility_hint: {
              key: 'acc_hint_key1',
              value: 'acc_hint_key1'
            },
          }
        ]
      }

      const listWithoutAccessibility = {
        translations: [
          {
            translation: {
              key: 'translation_key0',
              value: 'translation_val0'
            }
          },
          {
            translation: {
              key: 'translation_key1',
              value: 'translation_val1'
            }
          }
        ]
      }

      figma.ui.postMessage({
        type: 'translation', code: 'success',
        data: msg.data.generateAccessibility ? list.translations : listWithoutAccessibility.translations
      });
    }, 500)

*/
  } else if (msg.type === 'create_mr') {
    console.log('FLIP - Creating MR ...');

    // CREATE_MR API **************************************************
    const requestParams = {
      user_name: figma.currentUser.name,
      user_id: figma.currentUser.id,
      release_version: msg.data.release_version,
      target_repo: 'itt',
      package: msg.data.package,
      terminology: msg.data.terminology,
      texts: msg.data.entries,
      figma_url: [
        "https://www.figma.com/design/" + figma.fileKey
      ]
    }

    
    console.log(JSON.stringify(requestParams));


    
        (async () => {
    
          try {
            const data = await fetchWithErrorHandling(CREATE_MR_ENDPOINT,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    requestParams
                ),
              });
            figma.ui.postMessage({ type: 'merge_request', code: 'success', data: data.merge_request_link });
          } catch (error) {
            console.log('FLIP - Error occured while creating the merge request: ' + (error as Error).message);
            figma.ui.postMessage({ type: 'merge_request', code: 'failure', data: (error as Error).message });
          }
        })();
  
        

/*
    setTimeout(() => {
      const data = {
        merge_request_link: 'https://www.google.com/'
      }

      console.log('Sending back MR link: ' + data.merge_request_link);
      figma.ui.postMessage({ type: 'merge_request', code: 'success', data: data.merge_request_link });
      // figma.ui.postMessage({ type: 'merge_request', code: 'failure', data: 'Something went wrong while reating MR' });
    }, 500)

*/

  } else if (msg.type === 'loadAllMessages') {
    const messages = []
    traverse(figma.root, '', messages);
    setTimeout(() => {
      figma.ui.postMessage({ type: 'messages', mode: 'full', data: messages });
    }, 5000);
  } else {
    figma.closePlugin();
  }
};

// Fetch with error handling
async function fetchWithErrorHandling(url: any, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:' + (error as Error).message);
    throw error;
  }
}
