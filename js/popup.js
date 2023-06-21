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
            linkDiv.style.opacity = '0.5';
        });
        linkDiv.addEventListener('dragend', function(event) {
            linkDiv.style.opacity = '';
        });

        const linkCheckbox = document.createElement('input');
        linkCheckbox.type = 'checkbox';
        linkCheckbox.style.marginRight = '10px';

        const linkIcon = document.createElement('img');
        linkIcon.src = `https://www.google.com/s2/favicons?domain=${link.url}`;
        linkIcon.style.marginRight = '5px';
        linkIcon.style.height = '16px';
        linkIcon.style.width = '16px';

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
        linkContainer.style.display = 'flex';
        linkContainer.style.alignItems = 'center';
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
        groupTitleDiv.style.display = 'flex';
        groupTitleDiv.style.justifyContent = 'space-between';
        groupTitleDiv.style.alignItems = 'center';
        groupDiv.appendChild(groupTitleDiv);

        const groupTitle = document.createElement('h2');
        groupTitle.textContent = group.name;
        groupTitleDiv.appendChild(groupTitle);

        const addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.style.border = 'none';
        addButton.style.background = 'none';
        addButton.style.cursor = 'pointer';
        addButton.addEventListener('click', function() {
            const input = prompt('Enter a link and a name for this link, separated by a comma (optional name):');
            if (input) {
                let [url, name] = input.split(',').map(item => item.trim());
                url = correctUrl(url);
                if (url) {
                    group.links.push({ url, name: name || url });
                    chrome.storage.sync.set({ 'groups': groups }, function() {
                        displayLinks();
                    });
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
        const groupName = prompt('Enter a group name:');
        if (groupName && !groups.find(g => g.name === groupName)) {
            groups.push({ name: groupName, links: [] });
            chrome.storage.sync.set({ 'groups': groups }, function() {
                displayLinks();
            });
        }
    });
});