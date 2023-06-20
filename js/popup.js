document.addEventListener('DOMContentLoaded', function() {
    let links = {};

    // Define your addLink function
    function addLink() {
        const group = document.getElementById('group').value;
        const url = document.getElementById('url').value;
        const name = document.getElementById('name').value || url;

        if (group && url) {
            if (!links[group]) {
                links[group] = [];
            }
            links[group].push({ url, name });
            chrome.storage.sync.set({ 'links': links }, function() {
                displayLinks();
            });
        }

        document.getElementById('group').value = '';
        document.getElementById('url').value = '';
        document.getElementById('name').value = '';
    }

    // Start of displayLinks function
    function displayLinks() {
        chrome.storage.sync.get({ 'links': {} }, function(result) {
            if (result.links !== undefined) {
                links = result.links;
            } else {
                links = {};
            }

            const container = document.getElementById('link-container');
            container.innerHTML = '';

            for (let group in links) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'link-group';
                groupDiv.id = group;
                groupDiv.addEventListener('dragover', function(event) {
                    event.preventDefault();
                });
                groupDiv.addEventListener('drop', function(event) {
                    const { groupId, linkIndex } = JSON.parse(event.dataTransfer.getData('text'));
                    if (groupId === group && event.target.className === 'link-item') {
                        const targetIndex = Array.from(event.currentTarget.children).indexOf(event.target);
                        const [link] = links[group].splice(linkIndex, 1);
                        links[group].splice(targetIndex, 0, link);
                    } else if (groupId !== group) {
                        const link = links[groupId].splice(linkIndex, 1)[0];
                        if (links[groupId].length === 0) {
                            delete links[groupId];
                        }
                        if (!links[group]) {
                            links[group] = [];
                        }
                        links[group].push(link);
                    }
                    chrome.storage.sync.set({ 'links': links }, function() {
                        displayLinks();
                    });
                });
                const groupTitleDiv = document.createElement('div');
                groupTitleDiv.style.display = 'flex';
                groupTitleDiv.style.justifyContent = 'space-between';
                groupTitleDiv.style.alignItems = 'center';
                groupDiv.appendChild(groupTitleDiv);

                const groupTitle = document.createElement('h2');
                groupTitle.textContent = group;
                groupTitleDiv.appendChild(groupTitle);

                const addButton = document.createElement('button');
                addButton.textContent = '+';
                addButton.style.border = 'none';
                addButton.style.background = 'none';
                addButton.style.cursor = 'pointer';
                addButton.addEventListener('click', function() {
                    const input = prompt('Enter a link and a name for this link, separated by a comma (optional name):');
                    if (input) {
                        const [url, name] = input.split(',').map(item => item.trim());
                        if (url) {
                            links[group].push({ url, name: name || url });
                            chrome.storage.sync.set({ 'links': links }, function() {
                                displayLinks();
                            });
                        }
                    }
                });
                groupTitleDiv.appendChild(addButton);

                for (let i = 0; i < links[group].length; i++) {
                    const linkDiv = document.createElement('div');
                    linkDiv.className = 'link-item';
                    linkDiv.id = `${group}-${i}`;
                    linkDiv.draggable = 'true';
                    linkDiv.addEventListener('dragstart', function(event) {
                        event.dataTransfer.setData('text', JSON.stringify({ groupId: group, linkIndex: i }));
                        linkDiv.style.opacity = '0.5';
                    });
                    linkDiv.addEventListener('dragend', function(event) {
                        linkDiv.style.opacity = '';
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-button';
                    deleteButton.textContent = 'x';
                    deleteButton.addEventListener('click', function() {
                        links[group].splice(i, 1);
                        if (links[group].length === 0) {
                            delete links[group];
                        }
                        chrome.storage.sync.set({ 'links': links }, function() {
                            displayLinks();
                        });
                    });
                    linkDiv.appendChild(deleteButton);

                    const linkText = document.createElement('a');
                    linkText.textContent = links[group][i].name;
                    linkText.href = links[group][i].url;
                    linkText.target = '_blank';
                    linkText.addEventListener('dblclick', function() {
                        const newName = prompt('Edit link name:', links[group][i].name);
                        if (newName) {
                            links[group][i].name = newName;
                            chrome.storage.sync.set({ 'links': links }, function() {
                                displayLinks();
                            });
                        }
                    });
                    linkDiv.appendChild(linkText);

                    groupDiv.appendChild(linkDiv);
                }

                container.appendChild(groupDiv);
            }

        });
    }

    window.onload = displayLinks;

    document.getElementById('reset').addEventListener('click', function() {
        links = {};
        chrome.storage.sync.set({ 'links': links }, displayLinks);
    });

    chrome.storage.sync.get(null, function(items) {
        console.log(items);
    });

    document.getElementById('remove-group').addEventListener('click', function() {
        const group = prompt('Enter the name of the group you want to delete:');
        if (group && links[group]) {
            delete links[group];
            chrome.storage.sync.set({ 'links': links }, displayLinks);
        } else if (group == null) {} else {
            alert('This group does not exist');
        }
    });

    const buttonContainer = document.getElementById('button-container');

    const addGroup = `<button style="border: none; background: none; cursor: pointer;">Add Group</button>`;


    addGroup.id = 'add-group-button';
    addGroup.textContent = 'Add Group';
    //const deleteGroupButton = `<button style="border: none; background: none; cursor: pointer;">Remove Group</button>`;

    buttonContainer.insertAdjacentHTML('beforeend', addGroup);
    // buttonContainer.insertAdjacentHTML('beforeend', deleteGroupButton);

    buttonContainer.querySelectorAll('button')[buttonContainer.querySelectorAll('button').length - 1].addEventListener('click', function() {
        const group = prompt('Enter a group name:');
        if (group && !links[group]) {
            links[group] = [];
            chrome.storage.sync.set({ 'links': links }, function() {
                displayLinks();
            });
        }
    });

    // buttonContainer.querySelectorAll('button')[buttonContainer.querySelectorAll('button').length - 1].addEventListener('click', function() {
    //     const groupName = prompt('Enter the group name you want to delete:');
    //     if (groupName && links[groupName]) {
    //         delete links[groupName];
    //         chrome.storage.sync.set({ 'links': links }, displayLinks);
    //     }
    // });
});