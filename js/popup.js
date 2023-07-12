document.addEventListener('DOMContentLoaded', function() {
    let groups = [];

    function correctUrl(url) {
        if (!url.match(/^[a-zA-Z]+:\/\//)) {
            url = 'http://' + url;
        }
        return url;
    }

    function addLink() {
        const group = document.getElementById('group').value;
        let url = document.getElementById('url').value;
        const name = document.getElementById('name').value || url;

        url = correctUrl(url);

        if (group && url) {
            let groupObj = groups.find(g => g.name === group);
            if (!groupObj) {
                groupObj = { name: group, links: [] };
                groups.push(groupObj);
            }
            groupObj.links.push({ url, name });
            chrome.storage.sync.set({ 'groups': groups }, function() {
                displayLinks();
            });
        }

        document.getElementById('group').value = '';
        document.getElementById('url').value = '';
        document.getElementById('name').value = '';
    }

    function createLinkDiv(group, link, index) {
        const linkDiv = document.createElement('div');
        linkDiv.className = 'link-item';
        linkDiv.id = `${group.name}-${index}`;
        linkDiv.draggable = 'true';
        linkDiv.addEventListener('dragstart', function(event) {
            event.dataTransfer.setData('text', JSON.stringify({ groupId: group.name, linkIndex: index }));
            linkDiv.classList.add('link-item-dragging'); // Add class on drag start
        });
        linkDiv.addEventListener('dragend', function(event) {
            linkDiv.classList.remove('link-item-dragging'); // Remove class on drag end
        });

        const linkCheckbox = document.createElement('input');
        linkCheckbox.type = 'checkbox';
        linkCheckbox.className = 'checkbox'; // Assign class to linkCheckbox

        const linkIcon = document.createElement('img');
        linkIcon.src = `https://www.google.com/s2/favicons?domain=${link.url}`;
        linkIcon.className = 'link-icon'; // Assign class to linkIcon

        const linkText = document.createElement('a');
        linkText.textContent = link.name;
        linkText.href = link.url;
        linkText.target = '_blank';
        linkText.addEventListener('dblclick', function() {
            const newName = prompt('Edit link name:', link.name);
            if (newName) {
                link.name = newName;
                chrome.storage.sync.set({ 'groups': groups }, function() {
                    displayLinks();
                });
            }
        });

        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';

        linkContainer.appendChild(linkCheckbox);
        linkContainer.appendChild(linkIcon);
        linkContainer.appendChild(linkText);

        linkDiv.appendChild(linkContainer);

        return linkDiv;
    }

    function createGroupDiv(group) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'link-group';
        groupDiv.id = group.name;
        groupDiv.addEventListener('dragover', function(event) {
            event.preventDefault();
        });
        groupDiv.addEventListener('drop', function(event) {
            const { groupId, linkIndex } = JSON.parse(event.dataTransfer.getData('text'));
            if (groupId === group.name && event.target.className === 'link-item') {
                const targetIndex = Array.from(event.currentTarget.children).indexOf(event.target);
                const [link] = group.links.splice(linkIndex, 1);
                group.links.splice(targetIndex, 0, link);
            } else if (groupId !== group.name) {
                const oldGroup = groups.find(g => g.name === groupId);
                const link = oldGroup.links.splice(linkIndex, 1)[0];
                if (oldGroup.links.length === 0) {
                    const oldGroupIndex = groups.indexOf(oldGroup);
                    groups.splice(oldGroupIndex, 1);
                }
                group.links.push(link);
            }
            chrome.storage.sync.set({ 'groups': groups }, function() {
                displayLinks();
            });
        });

        const groupTitleDiv = document.createElement('div');
        groupTitleDiv.className = 'group-title-div';
        groupDiv.appendChild(groupTitleDiv);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'button delete';
        deleteButton.textContent = 'x';

        deleteButton.addEventListener('click', function() {
            const groupIndex = groups.findIndex(g => g.name === group.name);
            if (groupIndex !== -1) {
                groups.splice(groupIndex, 1);
            }
            chrome.storage.sync.set({ 'groups': groups }, function() {
                displayLinks();
            });
        });
        groupTitleDiv.appendChild(deleteButton);

        const groupTitle = document.createElement('h5');
        groupTitle.textContent = group.name;
        groupTitleDiv.appendChild(groupTitle);

        groupTitle.addEventListener('dblclick', function(e) {
            const input = document.createElement('input');
            input.value = group.name;
            groupTitle.textContent = '';
            groupTitle.appendChild(input);
            input.focus();

            input.addEventListener('blur', updateGroupName);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    updateGroupName();
                }
            });

            function updateGroupName() {
                groupTitle.classList.remove('group-title-div');
                const newName = input.value;
                if (!groups.find(g => g.name === newName)) {
                    const groupIndex = groups.findIndex(g => g.name === group.name);
                    if (groupIndex !== -1) {
                        groups[groupIndex].name = newName;
                        group.name = newName;
                    }

                    chrome.storage.sync.set({ 'groups': groups }, function() {
                        displayLinks();
                    });
                }
            }
        });

        const addButton = document.createElement('button');
        addButton.className = 'button add';
        addButton.textContent = '+';
        groupTitleDiv.appendChild(addButton);

        addButton.addEventListener('click', function() {
            const linkDiv = document.createElement('div');
            linkDiv.className = 'link-item';

            const linkContainer = document.createElement('div');
            linkContainer.className = 'link-container';

            const linkInput = document.createElement('input');
            linkInput.className = "no-border-link"
            linkInput.placeholder = 'Enter a link...';
            linkContainer.appendChild(linkInput);
            linkInput.focus();

            linkDiv.appendChild(linkContainer);
            groupDiv.appendChild(linkDiv);

            linkInput.addEventListener('blur', addLink);
            linkInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    addLink();
                }
            });

            function addLink() {
                let url = linkInput.value.trim();
                if (url) {
                    url = correctUrl(url);
                    const name = url;
                    group.links.push({ url, name });
                    chrome.storage.sync.set({ 'groups': groups }, function() {
                        displayLinks();
                    });
                } else {
                    setTimeout(function() {
                        if (groupDiv.contains(linkDiv)) {
                            groupDiv.removeChild(linkDiv);
                        }
                    }, 0);
                }
            }
        });

        groupTitleDiv.appendChild(addButton);

        for (let i = 0; i < group.links.length; i++) {
            const linkDiv = createLinkDiv(group, group.links[i], i);
            groupDiv.appendChild(linkDiv);
        }

        return groupDiv;
    }

    function displayLinks() {
        chrome.storage.sync.get({ 'groups': [] }, function(result) {
            if (result.groups !== undefined) {
                groups = result.groups;
            } else {
                groups = [];
            }

            const container = document.getElementById('link-container');
            container.innerHTML = '';

            for (let i = 0; i < groups.length; i++) {
                const groupDiv = createGroupDiv(groups[i]);
                container.appendChild(groupDiv);

                // Check if this is the last group
                if (i === groups.length - 1) {
                    // Scroll to the last group
                    groupDiv.scrollIntoView({ behavior: "smooth", block: "end" });
                }
            }
        });
    }


    window.onload = displayLinks;

    document.getElementById('reset').addEventListener('click', function() {
        groups = [];
        chrome.storage.sync.set({ 'groups': groups }, displayLinks);
    });

    chrome.storage.sync.get(null, function(items) {
        console.log(items);
    });

    document.getElementById('remove-group').addEventListener('click', function() {
        groups.forEach(group => {
            let i = group.links.length;
            while (i--) {
                const linkDiv = document.getElementById(`${group.name}-${i}`);
                const checkbox = linkDiv.querySelector('input[type="checkbox"]');
                if (checkbox.checked) {
                    group.links.splice(i, 1);
                    if (group.links.length === 0) {
                        const groupIndex = groups.indexOf(group);
                        groups.splice(groupIndex, 1);
                    }
                }
            }
        });
        chrome.storage.sync.set({ 'groups': groups }, displayLinks);
    });

    document.getElementById('add-group-button').addEventListener('click', function() {
        const container = document.getElementById('link-container');

        const groupDiv = document.createElement('div');
        groupDiv.className = 'link-group';

        const groupTitleDiv = document.createElement('div');
        groupTitleDiv.className = 'group-title-div';
        groupDiv.appendChild(groupTitleDiv);

        const groupTitle = document.createElement('h5');

        const input = document.createElement('input');
        input.className = "no-border-group"
        input.placeholder = 'Enter a group name...';
        groupTitle.appendChild(input);
        input.focus();

        groupTitleDiv.appendChild(groupTitle);

        container.appendChild(groupDiv);

        input.addEventListener('blur', updateGroupName);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                updateGroupName();
            }
        });

        function updateGroupName() {
            const groupName = input.value.trim();
            if (groupName && !groups.find(g => g.name === groupName)) {
                groups.push({ name: groupName, links: [] });
                chrome.storage.sync.set({ 'groups': groups }, function() {
                    displayLinks();
                });
            } else {
                setTimeout(function() {
                    if (container.contains(groupDiv)) {
                        container.removeChild(groupDiv);
                    }
                }, 0);
            }
        }
    });
});